const db = require("../config/db");

const refreshTokenModel = {
  // Tạo refresh token mới
  create: async (user_id, token, expires_at) => {
    const [result] = await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user_id, token, expires_at],
    );
    return result.insertId;
  },

  // Tìm refresh token
  findByToken: async (token) => {
    const [rows] = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = FALSE", //tìm token còn hiệu lực
      [token],
    );
    return rows[0];
  },

  // Revoke token (đăng xuất)
  revokeToken: async (token) => {
    await db.query(
      "UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?",
      [token],
    );
  },

  // Revoke tất cả token của user (đăng xuất tất cả thiết bị)
  revokeAllByUserId: async (user_id) => {
    await db.query(
      "UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?",
      [user_id],
    );
  },

  // Xóa token hết hạn (dọn dẹp database)
  deleteExpired: async () => {
    await db.query(
      "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE",
    );
  },
};

module.exports = refreshTokenModel;
