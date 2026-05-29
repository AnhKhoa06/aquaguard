const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const db = require('../config/db');

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, gender,
       DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
       health_status, address, emergency_contact,
       latitude, longitude, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.json({ success: true, message: 'OK', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
    full_name, email, phone, gender, date_of_birth,
    address, emergency_contact, latitude, longitude,
    } = req.body;

    const result = await db.query(
      `UPDATE users SET
        full_name = ?,
        email = ?,
        phone = ?,
        gender = ?,
        date_of_birth = ?,
        address = ?,
        emergency_contact = ?,
        latitude = ?,
        longitude = ?
       WHERE id = ?`,
      [
        full_name,
        email || null,
        phone || null,
        gender || null,
        date_of_birth || null,
        address || null,
        emergency_contact || null,
        latitude || null,
        longitude || null,
        req.user.id,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, gender,
       DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
       health_status, address, emergency_contact,
       latitude, longitude, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({ success: true, message: 'Cập nhật thành công.', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;