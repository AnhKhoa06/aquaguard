const shelterModel = require('../models/shelterModel');
const { successResponse, errorResponse } = require('../utils/response');

// Hàm Haversine tính khoảng cách 2 tọa độ (km)
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const shelterController = {
  // Lấy tất cả shelter
  findAll: async (req, res, next) => {
    try {
      const shelters = await shelterModel.findAll();
      return successResponse(res, shelters, 'Lấy danh sách shelter thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Lấy chi tiết 1 shelter
  findById: async (req, res, next) => {
    try {
      const shelter = await shelterModel.findById(req.params.id);
      if (!shelter) return errorResponse(res, 'Không tìm thấy shelter!', 404);
      return successResponse(res, shelter, 'Lấy chi tiết shelter thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Tìm shelter gần nhất còn chỗ
  findNearest: async (req, res, next) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return errorResponse(res, 'Vui lòng cung cấp tọa độ!', 400);

      const shelters = await shelterModel.findAll();

      const available = shelters
        .filter(s => s.current_count < s.capacity)
        .map(s => ({
          ...s,
          distance_km: haversine(
            parseFloat(lat), parseFloat(lng),
            parseFloat(s.latitude), parseFloat(s.longitude)
          ),
        }))
        .sort((a, b) => a.distance_km - b.distance_km);

      if (available.length === 0)
        return errorResponse(res, 'Không có shelter nào còn chỗ!', 404);

      return successResponse(res, available[0], 'Tìm shelter gần nhất thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Admin — tạo shelter
  create: async (req, res, next) => {
    try {
      const { name, address, capacity, latitude, longitude } = req.body;
      if (!name || !address || !capacity)
        return errorResponse(res, 'Vui lòng điền đầy đủ thông tin!', 400);

      const id = await shelterModel.create({ name, address, capacity, latitude, longitude });
      const shelter = await shelterModel.findById(id);
      return successResponse(res, shelter, 'Tạo shelter thành công!', 201);
    } catch (err) {
      next(err);
    }
  },

  // Admin — cập nhật shelter
  update: async (req, res, next) => {
    try {
      const shelter = await shelterModel.findById(req.params.id);
      if (!shelter) return errorResponse(res, 'Không tìm thấy shelter!', 404);

      await shelterModel.update(req.params.id, req.body);
      const updated = await shelterModel.findById(req.params.id);
      return successResponse(res, updated, 'Cập nhật shelter thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Admin — xoá shelter
  delete: async (req, res, next) => {
    try {
      const shelter = await shelterModel.findById(req.params.id);
      if (!shelter) return errorResponse(res, 'Không tìm thấy shelter!', 404);

      await shelterModel.delete(req.params.id);
      return successResponse(res, null, 'Xoá shelter thành công!');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = shelterController;
