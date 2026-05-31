const db = require("../config/db");

const userModel = {
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
      `SELECT id, full_name, phone, role, gender,
     DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
     health_status, health_note, latitude, longitude, created_at 
     FROM users WHERE id = ?`,
      [id],
    );
    return rows[0];
  },

  // Tạo user mới
  create: async ({
    full_name,
    phone,
    password_hash,
    gender,
    date_of_birth,
    role = "citizen",
  }) => {
    // Lấy thẳng string YYYY-MM-DD, không qua new Date()
    const formattedDate = date_of_birth ? date_of_birth.split("T")[0] : null;

    const [result] = await db.query(
      `INSERT INTO users 
        (full_name, phone, password_hash, gender, date_of_birth, role) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, phone, password_hash, gender, formattedDate, role],
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

  // Cập nhật trạng thái sức khỏe
  updateHealthStatus: async (id, health_status, health_note) => {
    await db.query(
      "UPDATE users SET health_status = ?, health_note = ? WHERE id = ?",
      [health_status, health_note, id],
    );
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (id, { full_name, gender, date_of_birth }) => {
    await db.query(
      "UPDATE users SET full_name = ?, gender = ?, date_of_birth = ? WHERE id = ?",
      [full_name, gender, date_of_birth, id],
    );
  },

  // Lấy tất cả users (admin)
  findAll: async () => {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, gender, 
     health_status, latitude, longitude, address, created_at 
     FROM users ORDER BY created_at DESC`,
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
