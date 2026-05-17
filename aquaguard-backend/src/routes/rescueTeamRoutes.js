const express = require("express");
const router = express.Router();
const rescueTeamController = require("../controllers/rescueTeamController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

// Admin — tạo đội cứu hộ
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  rescueTeamController.create,
);

// Admin + Responder — xem tất cả đội
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  rescueTeamController.findAll,
);

// Admin + Responder — xem chi tiết 1 đội
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "responder"),
  rescueTeamController.findById,
);

// Admin — thêm thành viên
router.post(
  "/:id/members",
  authMiddleware,
  authorizeRoles("admin"),
  rescueTeamController.addMember,
);

// Admin — xoá đội
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  rescueTeamController.delete,
);

module.exports = router;
