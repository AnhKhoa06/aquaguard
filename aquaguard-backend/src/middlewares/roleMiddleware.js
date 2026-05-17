const { errorResponse } = require("../utils/response");

const authorizeRoles = (...roles) => {
  //nhận vào danh sách role được phép, ví dụ authorizeRoles('admin')
  // hoặc authorizeRoles('admin', 'responder')
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Không có quyền truy cập!", 403);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Bạn không có quyền thực hiện hành động này!`,
        403,
      );
    }

    next();
  };
};

module.exports = authorizeRoles;
