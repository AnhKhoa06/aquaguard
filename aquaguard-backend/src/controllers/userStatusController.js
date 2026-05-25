const userStatusModel = require('../models/userStatusModel');
const { successResponse, errorResponse } = require('../utils/response');

const userStatusController = {
  // Cập nhật trạng thái và vị trí
  updateStatus: async (req, res, next) => {
    try {
      const { status, latitude, longitude } = req.body;
      const validStatus = ['online', 'offline', 'busy'];

      if (!status || !validStatus.includes(status)) {
        return errorResponse(res, 'Trạng thái không hợp lệ! (online/offline/busy)', 400);
      }

      await userStatusModel.updateStatus(req.user.id, {
        status,
        latitude,
        longitude
      });

      const updated = await userStatusModel.getStatus(req.user.id);
      return successResponse(res, updated, 'Cập nhật trạng thái thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Lấy trạng thái của mình
  getMyStatus: async (req, res, next) => {
    try {
      const status = await userStatusModel.getStatus(req.user.id);
      return successResponse(res, status, 'Lấy trạng thái thành công!');
    } catch (err) {
      next(err);
    }
  },

  // Lấy tất cả responder đang online (admin/citizen xem)
  getOnlineResponders: async (req, res, next) => {
    try {
      const responders = await userStatusModel.getOnlineResponders();
      return successResponse(res, responders, 'Lấy danh sách responder online thành công!');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userStatusController;