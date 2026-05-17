const familyModel = require("../models/familyModel");
const userModel = require("../models/userModel");
const { successResponse, errorResponse } = require("../utils/response");

const familyController = {
  // Thêm người thân theo số điện thoại
  addMember: async (req, res, next) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return errorResponse(res, "Vui lòng nhập số điện thoại!", 400);
      }

      // Tìm user theo số điện thoại
      const member = await userModel.findByPhone(phone);
      if (!member) {
        return errorResponse(
          res,
          "Không tìm thấy người dùng với số điện thoại này!",
          404,
        );
      }

      // Không thể thêm chính mình
      if (member.id === req.user.id) {
        return errorResponse(res, "Không thể thêm chính mình!", 400);
      }

      // Kiểm tra đã thêm chưa
      const already = await familyModel.exists(req.user.id, member.id);
      if (already) {
        return errorResponse(
          res,
          "Người này đã trong danh sách gia đình!",
          400,
        );
      }

      await familyModel.addMember(req.user.id, member.id);

      return successResponse(
        res,
        null,
        `Đã thêm ${member.full_name} vào gia đình!`,
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách người thân
  getFamily: async (req, res, next) => {
    try {
      const members = await familyModel.getFamily(req.user.id);
      return successResponse(
        res,
        members,
        "Lấy danh sách gia đình thành công!",
      );
    } catch (err) {
      next(err);
    }
  },

  // Xoá người thân
  removeMember: async (req, res, next) => {
    try {
      await familyModel.removeMember(req.user.id, req.params.memberId);
      return successResponse(res, null, "Đã xoá khỏi danh sách gia đình!");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = familyController;
