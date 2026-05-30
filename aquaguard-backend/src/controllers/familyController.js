const familyModel = require("../models/familyModel");
const userModel = require("../models/userModel");
const db = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

// Lấy danh sách người thân
const getFamily = async (req, res, next) => {
  try {
    const members = await familyModel.getFamily(req.user.id);
    return successResponse(res, members, "Lấy danh sách gia đình thành công!");
  } catch (err) {
    next(err);
  }
};

// Xoá người thân
const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const user_id = req.user.id;

    // Xóa 2 chiều family_members
    await db.query(
      `DELETE FROM family_members 
       WHERE (user_id = ? AND member_id = ?) 
          OR (user_id = ? AND member_id = ?)`,
      [user_id, memberId, memberId, user_id],
    );

    // Xóa invite liên quan
    await db.query(
      `DELETE FROM family_invites 
       WHERE (from_user_id = ? AND to_user_id = ?)
          OR (from_user_id = ? AND to_user_id = ?)`,
      [user_id, memberId, memberId, user_id],
    );

    return res.json({
      success: true,
      message: "Đã xoá khỏi danh sách gia đình!",
    });
  } catch (err) {
    next(err);
  }
};

// Tìm user theo SĐT
const searchByPhone = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.json({
        success: false,
        message: "Vui lòng nhập số điện thoại!",
      });

    let normalizedPhone = phone;
    if (phone.startsWith("+84")) normalizedPhone = "0" + phone.slice(3);

    const user = await userModel.findByPhone(normalizedPhone);
    if (!user)
      return res.json({
        success: false,
        message: "Không tìm thấy người dùng!",
      });
    if (user.id === req.user.id)
      return res.json({ success: false, message: "Không thể tìm chính mình!" });

    return res.json({
      success: true,
      data: { id: user.id, full_name: user.full_name, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
};

// Gửi lời mời kết nối
const sendInvite = async (req, res, next) => {
  try {
    const { to_user_id, relationship } = req.body;
    const from_user_id = req.user.id;

    // Check đã là người thân chưa
    const [alreadyFamily] = await db.query(
      "SELECT id FROM family_members WHERE user_id = ? AND member_id = ?",
      [from_user_id, to_user_id],
    );
    if (alreadyFamily.length > 0) {
      return res.json({
        success: false,
        message: "Người này đã là người thân của bạn!",
      });
    }

    // Check lời mời pending
    const [existing] = await db.query(
      'SELECT id FROM family_invites WHERE from_user_id = ? AND to_user_id = ? AND status = "pending"',
      [from_user_id, to_user_id],
    );
    if (existing.length > 0) {
      return res.json({ success: false, message: "Đã gửi lời mời trước đó!" });
    }

    await db.query(
      "INSERT INTO family_invites (from_user_id, to_user_id, relationship) VALUES (?, ?, ?)",
      [from_user_id, to_user_id, relationship || ""],
    );
    return res.json({ success: true, message: "Đã gửi lời mời kết nối!" });
  } catch (err) {
    next(err);
  }
};

// Lấy lời mời đang chờ
const getInvites = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT fi.*, u.full_name AS from_name, u.phone AS from_phone
       FROM family_invites fi
       JOIN users u ON fi.from_user_id = u.id
       WHERE fi.to_user_id = ? AND fi.status = 'pending'`,
      [req.user.id],
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Chấp nhận lời mời
const acceptInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const [rows] = await db.query("SELECT * FROM family_invites WHERE id = ?", [
      inviteId,
    ]);
    if (!rows[0])
      return res.json({ success: false, message: "Không tìm thấy lời mời!" });

    const invite = rows[0];
    await db.query(
      'UPDATE family_invites SET status = "accepted" WHERE id = ?',
      [inviteId],
    );
    await db.query(
      "INSERT IGNORE INTO family_members (user_id, member_id) VALUES (?, ?)",
      [invite.from_user_id, invite.to_user_id],
    );
    await db.query(
      "INSERT IGNORE INTO family_members (user_id, member_id) VALUES (?, ?)",
      [invite.to_user_id, invite.from_user_id],
    );

    return res.json({ success: true, message: "Đã chấp nhận lời mời!" });
  } catch (err) {
    next(err);
  }
};

// Từ chối lời mời
const rejectInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    await db.query(
      'UPDATE family_invites SET status = "rejected" WHERE id = ?',
      [inviteId],
    );
    return res.json({ success: true, message: "Đã từ chối lời mời!" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFamily,
  removeMember,
  searchByPhone,
  sendInvite,
  getInvites,
  acceptInvite,
  rejectInvite,
};
