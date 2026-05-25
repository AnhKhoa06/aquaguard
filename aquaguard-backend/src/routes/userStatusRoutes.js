const express = require('express');
const router = express.Router();
const userStatusController = require('../controllers/userStatusController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy trạng thái của mình
router.get('/me', authMiddleware, userStatusController.getMyStatus);

// Cập nhật trạng thái và vị trí
router.patch('/me', authMiddleware, userStatusController.updateStatus);

// Lấy tất cả responder đang online
router.get('/responders/online', authMiddleware, userStatusController.getOnlineResponders);

module.exports = router;