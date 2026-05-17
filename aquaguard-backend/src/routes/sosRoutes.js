const express = require("express");
const router = express.Router();
const sosController = require("../controllers/sosController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const upload = require("../config/upload");

// Citizen — gửi SOS (upload tối đa 5 ảnh)
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  sosController.create,
);

// Citizen — xem SOS của mình
router.get("/my", authMiddleware, sosController.getMy);

// Citizen — huỷ SOS của mình
router.patch("/:id/cancel", authMiddleware, sosController.cancel);

// Admin + Responder — xem tất cả SOS
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  sosController.findAll,
);

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

module.exports = router;
