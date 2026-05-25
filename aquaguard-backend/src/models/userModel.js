const db = require("../config/db");

const userModel = {
  // Tìm user theo email
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  // Tìm user theo phone
  findByPhone: async (phone) => {
    const [rows] = await db.query("SELECT * FROM users WHERE phone = ?", [
      phone,
    ]);
    return rows[0];
  },

  // Tìm user theo id
  findById: async (id) => {
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, role, latitude, longitude, created_at FROM users WHERE id = ?",
      [id],
    );
    return rows[0];
  },

  // Tạo user mới
  create: async ({
    full_name,
    email,
    phone,
    password_hash,
    role = "citizen",
  }) => {
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, phone, password_hash, role],
    );
    return result.insertId;
  },

  // Cập nhật vị trí
  updateLocation: async (id, latitude, longitude) => {
    await db.query(
      "UPDATE users SET latitude = ?, longitude = ? WHERE id = ?",
      [latitude, longitude, id],
    );
  },

  // Lấy tất cả users (admin)
  findAll: async () => {
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, role, created_at FROM users",
    );
    return rows;
  },

  // Cập nhật role
  updateRole: async (id, role) => {
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  },

  // Xóa user
  delete: async (id) => {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
  },
};

module.exports = userModel;
