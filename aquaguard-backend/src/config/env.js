require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },

  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    accessExpires: process.env.ACCESS_TOKEN_EXPIRES,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpires: process.env.REFRESH_TOKEN_EXPIRES,
  },
};
