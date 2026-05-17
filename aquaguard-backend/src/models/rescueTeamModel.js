const db = require("../config/db");

const rescueTeamModel = {
  // Tạo đội cứu hộ
  create: async ({ name, phone, area }) => {
    const [result] = await db.query(
      "INSERT INTO rescue_teams (name, phone, area) VALUES (?, ?, ?)",
      [name, phone, area],
    );
    return result.insertId;
  },

  // Lấy tất cả đội
  findAll: async () => {
    const [rows] = await db.query(
      "SELECT * FROM rescue_teams ORDER BY created_at DESC",
    );
    return rows;
  },

  // Lấy chi tiết 1 đội
  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM rescue_teams WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  // Thêm thành viên vào đội
  addMember: async (team_id, user_id) => {
    await db.query(
      "INSERT INTO rescue_team_members (team_id, user_id) VALUES (?, ?)",
      [team_id, user_id],
    );
  },

  // Lấy danh sách thành viên của đội
  getMembers: async (team_id) => {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.phone, u.email
       FROM rescue_team_members rtm
       JOIN users u ON rtm.user_id = u.id
       WHERE rtm.team_id = ?`,
      [team_id],
    );
    return rows;
  },

  // Xoá đội
  delete: async (id) => {
    await db.query("DELETE FROM rescue_teams WHERE id = ?", [id]);
  },
};

module.exports = rescueTeamModel;
