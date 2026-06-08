const express = require("express");
const cors = require("cors");
const env = require("./src/config/env");
const path = require("path");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const sosRoutes = require("./src/routes/sosRoutes");
const familyRoutes = require("./src/routes/familyRoutes");
const rescueTeamRoutes = require("./src/routes/rescueTeamRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const shelterRoutes = require("./src/routes/shelterRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const floodRoutes = require("./src/routes/floodRoutes");
const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");

// Import middleware
const errorMiddleware = require("./src/middlewares/errorMiddleware");

const app = express();

// Middleware toàn cục
app.use(cors()); //cho phép Angular gọi API từ domain khác
app.use(express.json()); //đọc được body dạng JSON từ request
app.use(express.urlencoded({ extended: true }));

// Serve static files (hình ảnh upload)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes - nhận request nếu khớp url thì chuyển sang Routes của file tương ứng
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/rescue-teams", rescueTeamRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/flood-data", floodRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Khởi động flood job
require("./src/jobs/floodJob");

// Health check
app.get("/", (req, res) => {
  res.json({ message: "AquaGuard API is running!" });
});

// Error handler — phải để cuối cùng
app.use(errorMiddleware);

// Khởi động server
app.listen(env.port, () => {
  console.log(`Server đang chạy tại http://localhost:${env.port}`);
});
