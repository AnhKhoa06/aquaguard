const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

// Tất cả route admin đều yêu cầu đăng nhập và role admin
router.use(authMiddleware, authorizeRoles("admin"));

// Dashboard thống kê
router.get("/dashboard", adminController.getDashboard);

// Quản lý users
router.get("/users", adminController.getUsers);
router.patch("/users/:id/role", adminController.updateRole);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
