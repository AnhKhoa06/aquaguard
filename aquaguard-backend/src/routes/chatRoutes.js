const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios"); //thư viện dùng để gọi HTTP request

router.post("/", authMiddleware, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.json({ success: false, message: "Messages không hợp lệ!" });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Bạn là AquaGuard AI Assistant — trợ lý ảo của nền tảng quản lý cứu hộ lũ lụt AquaGuard tại miền Trung Việt Nam.

            Thông tin về AquaGuard:
            - Là nền tảng web (không phải app di động)
            - Tính năng: gửi yêu cầu SOS, theo dõi đội cứu hộ, xem bản đồ lũ, nhận cảnh báo lũ
            - Để gửi SOS: đăng nhập vào web, vào mục SOS, điền thông tin và gửi
            - Không có số điện thoại hotline riêng
            - Số khẩn cấp quốc gia: Cảnh sát 113, Cứu hỏa 114, Cứu thương 115

            Cách trả lời:
            - Ngắn gọn, tự nhiên
            - Câu hỏi thường: 1-3 câu
            - Chỉ dùng danh sách khi cần liệt kê
            - Không bịa thông tin không có trong mô tả trên
            - Nếu không biết thì nói thẳng "AquaGuard hiện chưa có tính năng này"
            - Trả lời tiếng Việt, thân thiện

            Phạm vi: Ưu tiên trả lời về lũ lụt, cứu hộ, an toàn mùa mưa và tính năng AquaGuard. Các câu hỏi tự do khác cũng có thể trả lời nếu trong khả năng.`,
          },
          ...messages, //ghép lịch sử chat vào sau kịch bản vai diễn thành 1 mảng phẳng
        ],
        max_tokens: 500, //giới hạn độ dài câu trả lời
        temperature: 0.7, //độ sáng tạo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const reply = response.data.choices[0].message.content; //Lấy nội dung trả lời từ Groq
    res.json({ success: true, data: reply }); //Trả về cho fe
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ success: false, message: "Lỗi AI, thử lại sau!" });
  }
});

module.exports = router;
