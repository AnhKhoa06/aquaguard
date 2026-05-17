const rescueTeamModel = require("../models/rescueTeamModel");
const userModel = require("../models/userModel");
const { successResponse, errorResponse } = require("../utils/response");

const rescueTeamController = {
  // Tạo đội cứu hộ
  create: async (req, res, next) => {
    try {
      const { name, phone, area } = req.body;

      if (!name) {
        return errorResponse(res, "Vui lòng nhập tên đội cứu hộ!", 400);
      }

      const teamId = await rescueTeamModel.create({ name, phone, area });
      const team = await rescueTeamModel.findById(teamId);

      return successResponse(res, team, "Tạo đội cứu hộ thành công!", 201);
    } catch (err) {
      next(err);
    }
  },

  // Lấy tất cả đội
  findAll: async (req, res, next) => {
    try {
      const teams = await rescueTeamModel.findAll();

      // Gắn danh sách thành viên cho từng đội
      for (const team of teams) {
        team.members = await rescueTeamModel.getMembers(team.id);
      }

      return successResponse(
        res,
        teams,
        "Lấy danh sách đội cứu hộ thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  // Lấy chi tiết 1 đội
  findById: async (req, res, next) => {
    try {
      const team = await rescueTeamModel.findById(req.params.id);
      if (!team) {
        return errorResponse(res, "Không tìm thấy đội cứu hộ!", 404);
      }

      team.members = await rescueTeamModel.getMembers(team.id);

      return successResponse(res, team, "Lấy chi tiết đội cứu hộ thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Thêm thành viên vào đội
  addMember: async (req, res, next) => {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return errorResponse(res, "Vui lòng chọn thành viên!", 400);
      }

      const team = await rescueTeamModel.findById(req.params.id);
      if (!team) {
        return errorResponse(res, "Không tìm thấy đội cứu hộ!", 404);
      }

      const user = await userModel.findById(user_id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng!", 404);
      }

      await rescueTeamModel.addMember(req.params.id, user_id);

      return successResponse(
        res,
        null,
        `Đã thêm ${user.full_name} vào đội ${team.name}!`,
      );
    } catch (err) {
      next(err);
    }
  },

  // Xoá đội
  delete: async (req, res, next) => {
    try {
      const team = await rescueTeamModel.findById(req.params.id);
      if (!team) {
        return errorResponse(res, "Không tìm thấy đội cứu hộ!", 404);
      }

      await rescueTeamModel.delete(req.params.id);

      return successResponse(res, null, "Xoá đội cứu hộ thành công!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = rescueTeamController;
