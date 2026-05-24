const notificationModel = require('../models/notificationModel');
const { successResponse, errorResponse } = require('../utils/response');

const notificationController = {
	// Lấy thông báo của user đang đăng nhập
	getMyNotifications: async (req, res, next) => {
		try {
			const notifications = await notificationModel.findByUserId(req.user.id);
			return successResponse(res, notifications, 'Lấy danh sách thông báo thành công!');
		} catch (err) {
			next(err);
		}
	},

	// Đếm thông báo chưa đọc
	countUnread: async (req, res, next) => {
		try {
			const count = await notificationModel.countUnread(req.user.id);
			return successResponse(res, { unread_count: count }, 'Lấy số thông báo chưa đọc thành công!');
		} catch (err) {
			next(err);
		}
	},

	// Đánh dấu 1 thông báo đã đọc
	markAsRead: async (req, res, next) => {
		try {
			await notificationModel.markAsRead(req.params.id, req.user.id);
			return successResponse(res, null, 'Đã đánh dấu đọc!');
		} catch (err) {
			next(err);
		}
	},

	// Đánh dấu tất cả đã đọc
	markAllAsRead: async (req, res, next) => {
		try {
			await notificationModel.markAllAsRead(req.user.id);
			return successResponse(res, null, 'Đã đánh dấu tất cả đã đọc!');
		} catch (err) {
			next(err);
		}
	},
};

module.exports = notificationController;
