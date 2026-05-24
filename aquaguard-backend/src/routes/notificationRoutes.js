const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy danh sách thông báo của user đang đăng nhập
router.get('/', authMiddleware, notificationController.getMyNotifications);

// Đếm thông báo chưa đọc
router.get('/unread-count', authMiddleware, notificationController.countUnread);

// Đánh dấu tất cả đã đọc
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);

// Đánh dấu 1 thông báo đã đọc
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
