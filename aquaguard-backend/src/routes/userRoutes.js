const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const db = require("../config/db");
const axios = require("axios");

// GET /api/users/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, gender,
       DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
       health_status, address, emergency_contact,
       latitude, longitude, created_at
       FROM users WHERE id = ?`,
      [req.user.id],
    );

    if (!rows[0]) {
      return res.json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    res.json({ success: true, message: "OK", data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

// PUT /api/users/profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      full_name,
      email,
      gender,
      date_of_birth,
      address,
      emergency_contact,
      latitude,
      longitude,
      health_status, // ← thêm
    } = req.body;

    await db.query(
      `UPDATE users SET
        full_name = ?,
        email = ?,
        gender = ?,
        date_of_birth = ?,
        address = ?,
        emergency_contact = ?,
        latitude = ?,
        longitude = ?,
        health_status = COALESCE(?, health_status)
       WHERE id = ?`,
      [
        full_name,
        email || null,
        gender || null,
        date_of_birth || null,
        address || null,
        emergency_contact || null,
        latitude || null,
        longitude || null,
        health_status || null, // ← thêm
        req.user.id,
      ],
    );

    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, gender,
       DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
       health_status, address, emergency_contact,
       latitude, longitude, created_at
       FROM users WHERE id = ?`,
      [req.user.id],
    );

    res.json({ success: true, message: "Cập nhật thành công.", data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

// PUT /api/users/health
router.put("/health", authMiddleware, async (req, res) => {
  try {
    const { health_status } = req.body;
    const validStatus = ["safe", "danger", "injured", "unknown"];

    if (!health_status || !validStatus.includes(health_status)) {
      return res.json({ success: false, message: "Trạng thái không hợp lệ!" });
    }

    await db.query("UPDATE users SET health_status = ? WHERE id = ?", [
      health_status,
      req.user.id,
    ]);

    res.json({ success: true, message: "Cập nhật trạng thái thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.get("/reverse-geocode", authMiddleware, async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const response = await axios.get(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
    );
    const props = response.data.features[0]?.properties;
    if (!props) return res.json({ success: false, address: null });

    const parts = [props.name, props.county, props.state, props.country].filter(
      Boolean,
    );

    const address = parts.join(", ");
    res.json({ success: true, address });
  } catch (err) {
    res.json({ success: false, address: null });
  }
});

module.exports = router;
