const db = require("../config/db");

const alertModel = {
  // Tạo cảnh báo mới
  create: async ({
    created_by,
    title,
    message,
    severity,
    center_lat,
    center_lng,
    radius_km,
  }) => {
    const [result] = await db.query(
      `INSERT INTO alerts (created_by, title, message, severity, center_lat, center_lng, radius_km)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [created_by, title, message, severity, center_lat, center_lng, radius_km],
    );
    return result.insertId;
  },

  // Lấy tất cả cảnh báo
  findAll: async () => {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name AS created_by_name
       FROM alerts a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`,
    );
    return rows;
  },

  // Lấy chi tiết 1 cảnh báo
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name AS created_by_name
       FROM alerts a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ?`,
      [id],
    );
    return rows[0];
  },

  // Xoá cảnh báo
  delete: async (id) => {
    await db.query("DELETE FROM alerts WHERE id = ?", [id]);
  },
};

module.exports = alertModel;
