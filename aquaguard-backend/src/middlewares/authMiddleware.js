const { verifyAccessToken } = require("../config/jwt");
const { errorResponse } = require("../utils/response");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      //Lấy token từ header dạng Authorization: Bearer <token>
      return errorResponse(res, "Không có token, vui lòng đăng nhập!", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded; //req.user sẽ chứa { id, role } — các controller sau dùng để biết ai đang gọi API
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return errorResponse(res, "Token đã hết hạn!", 401);
    }
    return errorResponse(res, "Token không hợp lệ!", 401);
  }
};

module.exports = authMiddleware;
