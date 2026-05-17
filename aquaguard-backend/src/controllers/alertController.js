const alertModel = require("../models/alertModel");
const notificationModel = require("../models/notificationModel");
const userModel = require("../models/userModel");
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");

const alertController = {
  // Tạo cảnh báo mới (admin)
  create: async (req, res, next) => {
    try {
      const { title, message, severity, center_lat, center_lng, radius_km } =
        req.body;

      if (!title || !message || !severity) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin!", 400);
      }

      const alertId = await alertModel.create({
        created_by: req.user.id,
        title,
        message,
        severity,
        center_lat,
        center_lng,
        radius_km,
      });

      // Gửi thông báo cho tất cả user
      const users = await userModel.findAll();
      for (const user of users) {
        await notificationModel.create({
          user_id: user.id,
          alert_id: alertId,
          title,
          message,
        });
      }

      const alert = await alertModel.findById(alertId);

      return successResponse(res, alert, "Tạo cảnh báo thành công!", 201);
    } catch (err) {
      next(err);
    }
  },

  // Lấy tất cả cảnh báo
  findAll: async (req, res, next) => {
    try {
      const alerts = await alertModel.findAll();
      return successResponse(res, alerts, "Lấy danh sách cảnh báo thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Lấy chi tiết 1 cảnh báo
  findById: async (req, res, next) => {
    try {
      const alert = await alertModel.findById(req.params.id);
      if (!alert) {
        return errorResponse(res, "Không tìm thấy cảnh báo!", 404);
      }
      return successResponse(res, alert, "Lấy chi tiết cảnh báo thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Xoá cảnh báo (admin)
  delete: async (req, res, next) => {
    try {
      const alert = await alertModel.findById(req.params.id);
      if (!alert) {
        return errorResponse(res, "Không tìm thấy cảnh báo!", 404);
      }

      await alertModel.delete(req.params.id);

      return successResponse(res, null, "Xoá cảnh báo thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Lấy dữ liệu thời tiết từ Open-Meteo
  getWeather: async (req, res, next) => {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return errorResponse(res, "Vui lòng cung cấp tọa độ!", 400);
      }

      const response = await axios.get(
        "https://api.open-meteo.com/v1/forecast",
        {
          params: {
            latitude: lat,
            longitude: lng,
            current: "precipitation,rain,windspeed_10m,weathercode",
            hourly: "precipitation,rain",
            forecast_days: 1,
          },
        },
      );

      return successResponse(
        res,
        response.data,
        "Lấy dữ liệu thời tiết thành công!",
      );
    } catch (err) {
      next(err);
    }
  },
};

module.exports = alertController;
