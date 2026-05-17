const jwt = require("jsonwebtoken");
const env = require("./env");

const generateAccessToken = (payload) => {
  // thông tin nhúng vào token, thường là { id, role } của user
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

module.exports = {
  generateAccessToken, //tạo access token, hết hạn sau 15 phút
  generateRefreshToken, //tạo refresh token, hết hạn sau 7 ngày
  verifyAccessToken, //kiểm tra access token có hợp lệ không
  verifyRefreshToken, //kiểm tra refresh token có hợp lệ không
};
