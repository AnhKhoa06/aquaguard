const errorMiddleware = (err, req, res, next) => {
  console.error("Lỗi:", err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi server, vui lòng thử lại!";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
