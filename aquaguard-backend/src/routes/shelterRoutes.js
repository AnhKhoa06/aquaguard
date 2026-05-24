const express = require("express");
const router = express.Router();
const shelterController = require("../controllers/shelterController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

// Tất cả user — xem danh sách shelter
router.get("/", authMiddleware, shelterController.findAll);

// Tất cả user — tìm shelter gần nhất
router.get("/nearest", authMiddleware, shelterController.findNearest);

// Tất cả user — xem chi tiết shelter
router.get("/:id", authMiddleware, shelterController.findById);

// Admin — tạo shelter
router.post('/', authMiddleware, authorizeRoles('admin'), shelterController.create);

// Admin — cập nhật shelter
router.patch('/:id', authMiddleware, authorizeRoles('admin'), shelterController.update);

// Admin — xoá shelter
router.delete('/:id', authMiddleware, authorizeRoles('admin'), shelterController.delete);

module.exports = router;
