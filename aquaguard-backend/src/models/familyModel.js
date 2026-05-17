const db = require("../config/db");

const familyModel = {
  // Thêm người thân (tìm theo số điện thoại)
  addMember: async (user_id, member_id) => {
    await db.query(
      "INSERT INTO family_members (user_id, member_id) VALUES (?, ?)",
      [user_id, member_id],
    );
  },

  // Kiểm tra đã thêm chưa
  exists: async (user_id, member_id) => {
    const [rows] = await db.query(
      "SELECT id FROM family_members WHERE user_id = ? AND member_id = ?",
      [user_id, member_id],
    );
    return rows.length > 0;
  },

  // Lấy danh sách người thân
  getFamily: async (user_id) => {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.phone, u.health_status, u.latitude, u.longitude
       FROM family_members f
       JOIN users u ON f.member_id = u.id
       WHERE f.user_id = ?`,
      [user_id],
    );
    return rows;
  },

  // Xoá người thân
  removeMember: async (user_id, member_id) => {
    await db.query(
      "DELETE FROM family_members WHERE user_id = ? AND member_id = ?",
      [user_id, member_id],
    );
  },
};

module.exports = familyModel;
