const sosModel = require("../models/sosModel");
const { successResponse, errorResponse } = require("../utils/response");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db"); // ← thêm dòng này, đường dẫn tùy project
const sosController = {
  // Gửi yêu cầu SOS
  create: async (req, res, next) => {
    try {
      const {
        latitude,
        longitude,
        address,
        description,
        urgency_level,
        num_people,
      } = req.body;

      if (!latitude || !longitude) {
        return errorResponse(res, "Vui lòng cung cấp tọa độ vị trí!", 400);
      }

      const sosId = await sosModel.create({
        user_id: req.user.id,
        latitude,
        longitude,
        address,
        description,
        urgency_level: urgency_level || "medium",
        num_people: num_people || 1,
      });

      // Lưu hình ảnh nếu có
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map((file) => file.path);
        await sosModel.saveImages(sosId, imageUrls);
      }

      const sos = await sosModel.findById(sosId);
      const images = await sosModel.getImages(sosId);
      sos.images = images;

      return successResponse(res, sos, "Gửi yêu cầu SOS thành công!", 201);
    } catch (err) {
      next(err);
    }
  },

  // Lấy tất cả SOS (admin, responder)
  findAll: async (req, res, next) => {
    try {
      const { status } = req.query;
      const sosList = await sosModel.findAll(status);

      // Gắn hình ảnh cho từng SOS
      for (const sos of sosList) {
        sos.images = await sosModel.getImages(sos.id);
      }

      return successResponse(res, sosList, "Lấy danh sách SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Lấy SOS của chính mình (citizen)
  getMy: async (req, res, next) => {
    try {
      const sosList = await sosModel.findByUserId(req.user.id);

      for (const sos of sosList) {
        sos.images = await sosModel.getImages(sos.id);
      }

      return successResponse(res, sosList, "Lấy danh sách SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Lấy chi tiết 1 SOS
  findById: async (req, res, next) => {
    try {
      const sos = await sosModel.findById(req.params.id);
      if (!sos) {
        return errorResponse(res, "Không tìm thấy yêu cầu SOS!", 404);
      }

      sos.images = await sosModel.getImages(sos.id);

      return successResponse(res, sos, "Lấy chi tiết SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  getActive: async (req, res, next) => {
    try {
      const [rows] = await pool.query(`
      SELECT s.*, 
        u.full_name as citizen_name,
        u.phone as citizen_phone,
        t.name as team_name
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN rescue_teams t ON s.team_id = t.id
      WHERE s.status NOT IN ('resolved', 'cancelled')
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    `);
      return successResponse(res, rows, "Lấy danh sách SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  getAllForMap: async (req, res, next) => {
    try {
      const [rows] = await pool.query(`
      SELECT s.*, 
        u.full_name as citizen_name,
        u.phone as citizen_phone,
        t.name as team_name,
        r.full_name as responder_name
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN rescue_teams t ON s.team_id = t.id
      LEFT JOIN users r ON s.responder_id = r.id
      WHERE s.status NOT IN ('cancelled')
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    `);
      return successResponse(res, rows, "Lấy danh sách SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Admin phân công responder + team
  assignResponder: async (req, res, next) => {
    try {
      const { responder_id, team_id } = req.body;

      if (!responder_id) {
        return errorResponse(res, "Vui lòng chọn người cứu hộ!", 400);
      }

      const sos = await sosModel.findById(req.params.id);
      if (!sos) {
        return errorResponse(res, "Không tìm thấy yêu cầu SOS!", 404);
      }

      // ← Tự động lấy team_id từ responder_id
      const rescueTeamModel = require("../models/rescueTeamModel");
      const teamMember = await rescueTeamModel.findTeamByUserId(responder_id);
      const resolvedTeamId = team_id || teamMember?.team_id || null;

      await sosModel.assignResponder(
        req.params.id,
        responder_id,
        resolvedTeamId,
      );

      return successResponse(res, null, "Phân công cứu hộ thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật trạng thái SOS
  updateStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const validStatus = ["in_progress", "resolved", "cancelled"];

      if (!validStatus.includes(status)) {
        return errorResponse(res, "Trạng thái không hợp lệ!", 400);
      }

      const sos = await sosModel.findById(req.params.id);
      if (!sos) {
        return errorResponse(res, "Không tìm thấy yêu cầu SOS!", 404);
      }

      await sosModel.updateStatus(req.params.id, status);

      return successResponse(res, null, "Cập nhật trạng thái thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Huỷ SOS (citizen)
  cancel: async (req, res, next) => {
    try {
      const sos = await sosModel.findById(req.params.id);
      if (!sos) {
        return errorResponse(res, "Không tìm thấy yêu cầu SOS!", 404);
      }

      if (sos.user_id !== req.user.id) {
        return errorResponse(res, "Bạn không có quyền huỷ yêu cầu này!", 403);
      }

      if (sos.status !== "pending") {
        return errorResponse(
          res,
          "Chỉ có thể huỷ yêu cầu đang chờ xử lý!",
          400,
        );
      }

      await sosModel.cancel(req.params.id, req.user.id);

      return successResponse(res, null, "Huỷ yêu cầu SOS thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Responder tự nhận SOS
  accept: async (req, res, next) => {
    try {
      const sos = await sosModel.findById(req.params.id);
      if (!sos) {
        return errorResponse(res, "Không tìm thấy yêu cầu SOS!", 404);
      }

      if (sos.status !== "pending") {
        return errorResponse(res, "Yêu cầu này đã được xử lý!", 400);
      }

      // Kiểm tra responder có thuộc đội nào chưa
      const rescueTeamModel = require("../models/rescueTeamModel");
      const teamMember = await rescueTeamModel.findTeamByUserId(req.user.id);
      if (!teamMember) {
        return errorResponse(
          res,
          "Bạn chưa có nhóm cứu hộ, không thể nhận nhiệm vụ!",
          403,
        );
      }

      await sosModel.assignResponder(
        req.params.id,
        req.user.id,
        teamMember.team_id,
      );

      return successResponse(res, null, "Nhận nhiệm vụ thành công!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = sosController;
