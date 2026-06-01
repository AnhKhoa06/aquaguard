const pool = require("../config/db");

const floodDataModel = {
  upsert: async (data) => {
    const { latitude, longitude, precipitation_mm, risk_level, location_name } =
      data;
    const [result] = await pool.query(
      `INSERT INTO flood_data (latitude, longitude, precipitation_mm, risk_level, location_name, recorded_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       precipitation_mm = VALUES(precipitation_mm),
       risk_level = VALUES(risk_level),
       location_name = VALUES(location_name),
       recorded_at = NOW()`,
      [latitude, longitude, precipitation_mm, risk_level, location_name],
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM flood_data ORDER BY recorded_at DESC",
    );
    return rows;
  },
};

module.exports = floodDataModel;
