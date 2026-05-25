const db = require('../config/db');

const userStatusModel = {
  // Cập nhật trạng thái và vị trí user
  updateStatus: async (user_id, { status, latitude, longitude }) => {
    await db.query(
      `UPDATE users SET status = ?, latitude = ?, longitude = ? WHERE id = ?`,
      [status, latitude, longitude, user_id]
    );
  },

  // Lấy trạng thái user
  getStatus: async (user_id) => {
    const [rows] = await db.query(
      `SELECT id, full_name, phone, role, status, latitude, longitude FROM users WHERE id = ?`,
      [user_id]
    );
    return rows[0];
  },

  // Lấy tất cả responder đang online
  getOnlineResponders: async () => {
    const [rows] = await db.query(
      `SELECT id, full_name, phone, latitude, longitude, status
       FROM users
       WHERE role = 'responder' AND status = 'online'`
    );
    return rows;
  },
};

module.exports = userStatusModel;