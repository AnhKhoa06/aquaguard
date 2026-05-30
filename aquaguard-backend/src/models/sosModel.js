const db = require("../config/db");

const sosModel = {
  // Tạo yêu cầu SOS mới
  create: async ({
    user_id,
    latitude,
    longitude,
    address,
    description,
    urgency_level,
    num_people,
  }) => {
    const [result] = await db.query(
      `INSERT INTO sos_requests 
        (user_id, latitude, longitude, address, description, urgency_level, num_people) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        latitude,
        longitude,
        address,
        description,
        urgency_level,
        num_people,
      ],
    );
    return result.insertId;
  },

  // Lưu hình ảnh SOS
  saveImages: async (sos_id, image_urls) => {
    const values = image_urls.map((url) => [sos_id, url]);
    await db.query("INSERT INTO sos_images (sos_id, image_url) VALUES ?", [
      values,
    ]);
  },

  // Lấy hình ảnh theo sos_id
  getImages: async (sos_id) => {
    const [rows] = await db.query("SELECT * FROM sos_images WHERE sos_id = ?", [
      sos_id,
    ]);
    return rows;
  },

  // Lấy tất cả SOS (admin, responder)
  findAll: async (status = null) => {
    let query = `
      SELECT s.*,
        u.full_name AS citizen_name, u.phone AS citizen_phone,
        u.age AS citizen_age, u.gender AS citizen_gender,
        r.full_name AS responder_name,
        r.latitude AS responder_latitude,
        r.longitude AS responder_longitude,
        r.status AS responder_status,
        t.name AS team_name
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN users r ON s.responder_id = r.id
      LEFT JOIN rescue_teams t ON s.team_id = t.id
    `;
    if (status) {
      query += " WHERE s.status = ? ORDER BY s.created_at DESC";
      const [rows] = await db.query(query, [status]);
      return rows;
    }
    query += " ORDER BY s.created_at DESC";
    const [rows] = await db.query(query);
    return rows;
  },

  // Lấy SOS của chính mình (citizen)
  findByUserId: async (user_id) => {
    const [rows] = await db.query(
      `SELECT s.*,
        r.full_name AS responder_name, r.phone AS responder_phone,
        r.latitude AS responder_latitude,
        r.longitude AS responder_longitude,
        r.status AS responder_status,
        t.name AS team_name
       FROM sos_requests s
       LEFT JOIN users r ON s.responder_id = r.id
       LEFT JOIN rescue_teams t ON s.team_id = t.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [user_id],
    );
    return rows;
  },

  // Lấy chi tiết 1 SOS
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT s.*,
        u.full_name AS citizen_name, u.phone AS citizen_phone,
        u.age AS citizen_age, u.gender AS citizen_gender,
        r.full_name AS responder_name, r.phone AS responder_phone,
        r.latitude AS responder_latitude,
        r.longitude AS responder_longitude,
        r.status AS responder_status,
        t.name AS team_name, t.phone AS team_phone
       FROM sos_requests s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN users r ON s.responder_id = r.id
       LEFT JOIN rescue_teams t ON s.team_id = t.id
       WHERE s.id = ?`,
      [id],
    );
    return rows[0];
  },

  // Phân công responder + team
  assignResponder: async (id, responder_id, team_id) => {
    await db.query(
      `UPDATE sos_requests 
       SET responder_id = ?, team_id = ?, status = 'assigned' 
       WHERE id = ?`,
      [responder_id, team_id, id],
    );
  },

  // Cập nhật trạng thái
  updateStatus: async (id, status) => {
    await db.query("UPDATE sos_requests SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
  },

  // Huỷ SOS
  cancel: async (id, user_id) => {
    await db.query(
      `UPDATE sos_requests SET status = 'cancelled' 
       WHERE id = ? AND user_id = ?`,
      [id, user_id],
    );
  },

  // Đếm theo trạng thái (admin dashboard)
  countByStatus: async () => {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count 
       FROM sos_requests 
       GROUP BY status`,
    );
    return rows;
  },
};

module.exports = sosModel;
