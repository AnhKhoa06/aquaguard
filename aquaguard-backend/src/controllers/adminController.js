const userModel = require("../models/userModel");
const sosModel = require("../models/sosModel");
const alertModel = require("../models/alertModel");
const rescueTeamModel = require("../models/rescueTeamModel");
const { successResponse, errorResponse } = require("../utils/response");

const adminController = {
  // Thống kê tổng quan, lấy data từ DB rồi tính toán các con số thống kê để trả về cho frontend hiển thị.
  getDashboard: async (req, res, next) => {
    try {
      const users = await userModel.findAll(); // Lấy toàn bộ danh sách users từ database
      const sosList = await sosModel.findAll(); // Lấy toàn bộ danh sách SOS từ database
      const alerts = await alertModel.findAll(); // Lấy toàn bộ alerts (không dùng trong Overview nhưng cần cho total_alerts)
      const teams = await rescueTeamModel.findAll(); // Lấy toàn bộ đội cứu hộ
      const sosByStatus = await sosModel.countByStatus(); // Đếm SOS theo từng status (pending/resolved/...) — dùng cho analytics sau

      const total_citizens = users.filter((u) => u.role === "citizen").length; // Đếm user có role === 'citizen'
      const total_rescuers = users.filter((u) => u.role === "responder").length; // Đếm user có role === 'responder'
      const total_admins = users.filter((u) => u.role === "admin").length; // Đếm user có role === 'admin'
      const pending_sos = sosList.filter((s) => s.status === "pending").length; // Đếm SOS đang chờ xử lý

      const today = new Date().toISOString().slice(0, 10); // Lấy ngày hôm nay dạng "2026-05-27"
      const resolved_today = sosList.filter(
        // Đếm SOS đã resolved VÀ được cập nhật hôm nay
        (s) =>
          s.status === "resolved" &&
          s.updated_at?.toISOString().slice(0, 10) === today,
      ).length;

      const active_rescuers = users.filter(
        // Đếm rescuer có health_status === 'safe' → coi là đang sẵn sàng hoạt động
        (u) => u.role === "responder" && u.health_status === "safe",
      ).length;

      const active_sos = sosList.filter(
        // Đếm SOS chưa kết thúc (không phải resolved hoặc cancelled) → đang hoạt động
        (s) => !["resolved", "cancelled"].includes(s.status),
      ).length;

      return successResponse(
        res,
        {
          total_users: users.length,
          total_citizens,
          total_rescuers,
          total_admins,
          total_sos: sosList.length,
          pending_sos,
          resolved_today,
          active_rescuers,
          active_sos,
          total_alerts: alerts.length,
          total_teams: teams.length,
          sos_by_status: sosByStatus,
          rescue_teams: teams,
        },
        "Lấy thống kê thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  // Lấy tất cả users
  getUsers: async (req, res, next) => {
    try {
      const users = await userModel.findAll();
      return successResponse(
        res,
        users,
        "Lấy danh sách người dùng thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật role user
  updateRole: async (req, res, next) => {
    try {
      const { role } = req.body;
      const validRoles = ["citizen", "responder", "admin"];

      if (!validRoles.includes(role)) {
        return errorResponse(res, "Role không hợp lệ!", 400);
      }

      await userModel.updateRole(req.params.id, role);

      return successResponse(res, null, "Cập nhật role thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Xoá user
  deleteUser: async (req, res, next) => {
    try {
      await userModel.delete(req.params.id);
      return successResponse(res, null, "Xoá người dùng thành công!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
