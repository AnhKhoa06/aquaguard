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

router.get("/my-team", authMiddleware, rescueTeamController.getMyTeam);

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

// Responder — gửi yêu cầu tham gia đội
router.post(
  "/:id/join-request",
  authMiddleware,
  authorizeRoles("responder"),
  rescueTeamController.requestJoin,
);

// Admin — xem danh sách xin tham gia
router.get(
  "/join-requests/all",
  authMiddleware,
  authorizeRoles("admin"),
  rescueTeamController.getJoinRequests,
);

// Admin — duyệt/từ chối
router.patch(
  "/join-requests/:requestId",
  authMiddleware,
  authorizeRoles("admin"),
  rescueTeamController.handleJoinRequest,
);

// Responder — xem request của mình
router.get(
  "/join-requests/mine",
  authMiddleware,
  authorizeRoles("responder"),
  rescueTeamController.getMyJoinRequest,
);

module.exports = router;
