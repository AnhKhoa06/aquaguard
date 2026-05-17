const db = require("../config/db");

const notificationModel = {
  // Tạo thông báo mới
  create: async ({ user_id, alert_id, title, message }) => {
    await db.query(
      `INSERT INTO notifications (user_id, alert_id, title, message)
       VALUES (?, ?, ?, ?)`,
      [user_id, alert_id, title, message],
    );
  },

  // Lấy thông báo của user
  findByUserId: async (user_id) => {
    const [rows] = await db.query(
      `SELECT n.*, a.severity
       FROM notifications n
       LEFT JOIN alerts a ON n.alert_id = a.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [user_id],
    );
    return rows;
  },

  // Đánh dấu đã đọc
  markAsRead: async (id, user_id) => {
    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [id, user_id],
    );
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (user_id) => {
    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [user_id],
    );
  },

  // Đếm thông báo chưa đọc
  countUnread: async (user_id) => {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [user_id],
    );
    return rows[0].count;
  },
};

module.exports = notificationModel;
