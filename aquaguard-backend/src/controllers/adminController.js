const userModel = require("../models/userModel");
const sosModel = require("../models/sosModel");
const alertModel = require("../models/alertModel");
const rescueTeamModel = require("../models/rescueTeamModel");
const { successResponse, errorResponse } = require("../utils/response");

const adminController = {
  // Thống kê tổng quan
  getDashboard: async (req, res, next) => {
    try {
      const users = await userModel.findAll();
      const sosList = await sosModel.findAll();
      const alerts = await alertModel.findAll();
      const teams = await rescueTeamModel.findAll();
      const sosByStatus = await sosModel.countByStatus();

      const total_citizens = users.filter((u) => u.role === "citizen").length;
      const total_rescuers = users.filter((u) => u.role === "responder").length;
      const total_admins = users.filter((u) => u.role === "admin").length;
      const pending_sos = sosList.filter((s) => s.status === "pending").length;

      const today = new Date().toISOString().slice(0, 10);
      const resolved_today = sosList.filter(
        (s) =>
          s.status === "resolved" &&
          s.updated_at?.toISOString().slice(0, 10) === today,
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
