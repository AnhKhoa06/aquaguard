const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const { successResponse, errorResponse } = require("../utils/response");
const env = require("../config/env");

const authController = {
  // Đăng ký
  register: async (req, res, next) => {
    try {
      const { full_name, email, phone, password } = req.body;

      // Kiểm tra đủ thông tin
      if (!full_name || !email || !phone || !password) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin!", 400);
      }

      // Kiểm tra email đã tồn tại chưa
      const existingEmail = await userModel.findByEmail(email);
      if (existingEmail) {
        return errorResponse(res, "Email đã được sử dụng!", 400);
      }

      // Kiểm tra phone đã tồn tại chưa
      const existingPhone = await userModel.findByPhone(phone);
      if (existingPhone) {
        return errorResponse(res, "Số điện thoại đã được sử dụng!", 400);
      }

      // Mã hóa password salt rounds = 10
      const password_hash = await bcrypt.hash(password, 10);

      // Tạo user mới
      const userId = await userModel.create({
        full_name,
        email,
        phone,
        password_hash,
      });

      const newUser = await userModel.findById(userId);

      return successResponse(res, newUser, "Đăng ký thành công!", 201);
    } catch (err) {
      next(err); //đẩy lỗi xuống errorMiddleware xử lý
    }
  },

  // Đăng nhập
  login: async (req, res, next) => {
    try {
      const { phone, password } = req.body;

      // Kiểm tra đủ thông tin
      if (!phone || !password) {
        return errorResponse(
          res,
          "Vui lòng điền số điện thoại và mật khẩu!",
          400,
        );
      }

      // Tìm user theo phone
      const user = await userModel.findByPhone(phone);
      if (!user) {
        return errorResponse(
          res,
          "Số điện thoại hoặc mật khẩu không đúng!",
          401,
        );
      }

      // Kiểm tra password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return errorResponse(
          res,
          "Số điện thoại hoặc mật khẩu không đúng!",
          401,
        );
      }

      // Tạo payload
      const payload = { id: user.id, role: user.role };

      // Tạo access token và refresh token
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Tính thời gian hết hạn refresh token (7 ngày)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Lưu refresh token vào database
      await refreshTokenModel.create(user.id, refreshToken, expiresAt);

      return successResponse(
        res,
        {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        },
        "Đăng nhập thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(res, "Không có refresh token!", 401);
      }

      // Kiểm tra refresh token trong database
      const tokenRecord = await refreshTokenModel.findByToken(refreshToken);
      if (!tokenRecord) {
        return errorResponse(
          res,
          "Refresh token không hợp lệ hoặc đã bị thu hồi!",
          401,
        );
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Tạo access token mới
      const newAccessToken = generateAccessToken({
        id: decoded.id,
        role: decoded.role,
      });

      return successResponse(
        res,
        {
          accessToken: newAccessToken,
        },
        "Làm mới token thành công!",
      );
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return errorResponse(
          res,
          "Refresh token đã hết hạn, vui lòng đăng nhập lại!",
          401,
        );
      }
      next(err);
    }
  },

  // Đăng xuất
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(res, "Không có refresh token!", 400);
      }

      // Revoke refresh token
      await refreshTokenModel.revokeToken(refreshToken);

      return successResponse(res, null, "Đăng xuất thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Lấy thông tin user đang đăng nhập
  getMe: async (req, res, next) => {
    try {
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng!", 404);
      }
      return successResponse(res, user, "Lấy thông tin thành công!");
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật vị trí
  updateLocation: async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return errorResponse(res, "Vui lòng cung cấp tọa độ!", 400);
      }

      await userModel.updateLocation(req.user.id, latitude, longitude);

      return successResponse(res, null, "Cập nhật vị trí thành công!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
