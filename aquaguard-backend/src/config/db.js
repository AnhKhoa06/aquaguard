const mysql = require("mysql2/promise"); //dùng async/await thay vì callback cho dễ code
const env = require("./env");

const pool = mysql.createPool({
  //tạo pool kết nối, tốt hơn single connection vì xử lý được nhiều request cùng lúc
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10, //tối đa 10 kết nối đồng thời
  queueLimit: 0,
});

// Test kết nối
pool
  .getConnection()
  .then((connection) => {
    console.log("Kết nối MySQL thành công!");
    connection.release();
  })
  .catch((err) => {
    console.error("Kết nối MySQL thất bại:", err.message);
  });

module.exports = pool;
