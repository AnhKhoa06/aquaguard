const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

// Tất cả user — xem danh sách cảnh báo
router.get("/", authMiddleware, alertController.findAll);

// Tất cả user — xem chi tiết cảnh báo
router.get("/weather", authMiddleware, alertController.getWeather);

// Tất cả user — xem chi tiết cảnh báo
router.get("/:id", authMiddleware, alertController.findById);

// Admin — tạo cảnh báo
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  alertController.create,
);

// Admin — xoá cảnh báo
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  alertController.delete,
);

module.exports = router;
