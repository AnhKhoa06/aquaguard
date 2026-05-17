const sosModel = require("../models/sosModel");
const { successResponse, errorResponse } = require("../utils/response");
const path = require("path");
const fs = require("fs");

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
        const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
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

      await sosModel.assignResponder(req.params.id, responder_id, team_id);

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
};

module.exports = sosController;
