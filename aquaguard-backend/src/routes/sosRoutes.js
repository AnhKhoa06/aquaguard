const express = require("express");
const router = express.Router();
const sosController = require("../controllers/sosController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const upload = require("../config/upload");
const db = require("../config/db");

// Citizen — gửi SOS (upload tối đa 5 ảnh)
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  sosController.create,
); //upload.array("images", 5) chạy trước controller
// Multer upload ảnh lên Cloudinary, rồi gắn URL vào req.files[].path để controller lưu vào DB.

// Citizen — xem SOS của mình
router.get("/my", authMiddleware, sosController.getMy);

// Admin + Responder — xem tất cả SOS
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  sosController.findAll,
);

// Citizen — xem tất cả SOS active trên bản đồ
router.get("/map/active", authMiddleware, sosController.getActive);

router.get("/map/all", authMiddleware, sosController.getAllForMap);

// Admin + Responder — xem chi tiết 1 SOS
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  sosController.findById,
);

// Admin — phân công cứu hộ
router.patch(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("admin"),
  sosController.assignResponder,
);

// Admin + Responder — cập nhật trạng thái
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  sosController.updateStatus,
);

// Responder tự nhận SOS
router.patch(
  "/:id/accept",
  authMiddleware,
  authorizeRoles("responder"),
  sosController.accept,
);

// Cứu hộ cập nhật vị trí realtime
router.patch(
  "/:id/location",
  authMiddleware,
  authorizeRoles("responder"),
  async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      await db.query(
        `UPDATE sos_requests 
         SET responder_latitude = ?, responder_longitude = ?
         WHERE id = ? AND responder_id = ?`,
        [latitude, longitude, req.params.id, req.user.id],
      );
      return res.json({ success: true, message: "Đã cập nhật vị trí!" });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("citizen"),
  sosController.delete,
);

module.exports = router;
