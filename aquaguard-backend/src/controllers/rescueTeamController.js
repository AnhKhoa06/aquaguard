const rescueTeamModel = require("../models/rescueTeamModel");
const userModel = require("../models/userModel");
const { successResponse, errorResponse } = require("../utils/response");
const db = require("../config/db");

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

      // ← thêm: kiểm tra đã là thành viên chưa
      const [existing] = await db.query(
        `SELECT id FROM rescue_team_members WHERE team_id = ? AND user_id = ?`,
        [req.params.id, user_id],
      );
      if (existing.length > 0) {
        return errorResponse(
          res,
          `${user.full_name} đã là thành viên của đội này!`,
          400,
        );
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

  removeMember: async (req, res, next) => {
    try {
      const { id: teamId, userId } = req.params;

      const [rows] = await db.query(
        `SELECT * FROM rescue_team_members WHERE team_id = ? AND user_id = ?`,
        [teamId, userId],
      );

      if (rows.length === 0) {
        return errorResponse(res, "Thành viên không tồn tại trong đội!", 404);
      }

      await db.query(
        `DELETE FROM rescue_team_members WHERE team_id = ? AND user_id = ?`,
        [teamId, userId],
      );

      return successResponse(res, null, "Đã xóa thành viên khỏi đội!");
    } catch (err) {
      next(err);
    }
  },

  requestJoin: async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const userId = req.user.id;

      const [existing] = await db.query(
        `SELECT id FROM join_requests WHERE user_id = ? AND status = 'pending'`,
        [userId],
      );
      if (existing.length > 0) {
        return errorResponse(
          res,
          "Bạn đã có yêu cầu tham gia đang chờ duyệt!",
          400,
        );
      }

      const [inTeam] = await db.query(
        `SELECT id FROM rescue_team_members WHERE user_id = ?`,
        [userId],
      );
      if (inTeam.length > 0) {
        return errorResponse(res, "Bạn đã thuộc một đội cứu hộ!", 400);
      }

      await db.query(
        `INSERT INTO join_requests (user_id, team_id) VALUES (?, ?)`,
        [userId, teamId],
      );

      return successResponse(res, null, "Đã gửi yêu cầu tham gia đội!");
    } catch (err) {
      next(err);
    }
  },

  getMyJoinRequest: async (req, res, next) => {
    try {
      const [rows] = await db.query(
        `SELECT jr.*, rt.name as team_name 
       FROM join_requests jr
       JOIN rescue_teams rt ON jr.team_id = rt.id
       WHERE jr.user_id = ?
       ORDER BY jr.created_at DESC
       LIMIT 1`,
        [req.user.id],
      );
      return successResponse(res, rows[0] || null, "OK");
    } catch (err) {
      next(err);
    }
  },

  getJoinRequests: async (req, res, next) => {
    try {
      const [rows] = await db.query(
        `SELECT jr.*, u.full_name, u.phone, rt.name as team_name
       FROM join_requests jr
       JOIN users u ON jr.user_id = u.id
       JOIN rescue_teams rt ON jr.team_id = rt.id
       WHERE jr.status = 'pending'
       ORDER BY jr.created_at DESC`,
      );
      return successResponse(res, rows, "OK");
    } catch (err) {
      next(err);
    }
  },

  handleJoinRequest: async (req, res, next) => {
    try {
      const { status } = req.body;
      const requestId = req.params.requestId;

      const [rows] = await db.query(
        `SELECT * FROM join_requests WHERE id = ?`,
        [requestId],
      );
      if (!rows[0]) return errorResponse(res, "Không tìm thấy yêu cầu!", 404);

      const request = rows[0];

      await db.query(`UPDATE join_requests SET status = ? WHERE id = ?`, [
        status,
        requestId,
      ]);

      if (status === "approved") {
        await db.query(
          `INSERT INTO rescue_team_members (team_id, user_id) VALUES (?, ?)`,
          [request.team_id, request.user_id],
        );
      }

      return successResponse(
        res,
        null,
        status === "approved" ? "Đã duyệt!" : "Đã từ chối!",
      );
    } catch (err) {
      next(err);
    }
  },

  getMyTeam: async (req, res, next) => {
    try {
      const teamMember = await rescueTeamModel.findTeamByUserId(req.user.id);
      if (!teamMember) {
        return successResponse(res, null, "Bạn chưa có đội cứu hộ");
      }
      const team = await rescueTeamModel.findById(teamMember.team_id);
      const members = await rescueTeamModel.getMembers(teamMember.team_id);
      return successResponse(
        res,
        { ...team, members },
        "Lấy thông tin đội thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  leaveTeam: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const [rows] = await db.query(
        `SELECT * FROM rescue_team_members WHERE user_id = ?`,
        [userId],
      );

      if (rows.length === 0) {
        return errorResponse(res, "Bạn chưa thuộc đội nào!", 400);
      }

      await db.query(`DELETE FROM rescue_team_members WHERE user_id = ?`, [
        userId,
      ]);

      //xóa luôn join_request cũ
      await db.query(`DELETE FROM join_requests WHERE user_id = ?`, [userId]);

      return successResponse(res, null, "Đã rời đội thành công!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = rescueTeamController;
