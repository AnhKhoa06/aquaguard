const cron = require("node-cron");
const axios = require("axios");
const floodDataModel = require("../models/floodDataModel");

const locations = [
  // Duyên hải miền Trung
  { name: "Quảng Bình", lat: 17.469, lng: 106.622 },
  { name: "Huế", lat: 16.463, lng: 107.59 },
  { name: "Đà Nẵng", lat: 16.047, lng: 108.206 },
  { name: "Quảng Nam", lat: 15.879, lng: 108.335 },
  { name: "Quảng Ngãi", lat: 15.12, lng: 108.792 },
  { name: "Bình Định", lat: 13.782, lng: 109.219 },
  { name: "Phú Yên", lat: 13.095, lng: 109.093 },
  { name: "Khánh Hòa", lat: 12.239, lng: 109.197 },
  { name: "Ninh Thuận", lat: 11.564, lng: 108.988 },
  { name: "Bình Thuận", lat: 10.928, lng: 108.102 },

  // Tây Nguyên
  { name: "Gia Lai", lat: 13.983, lng: 108.025 },
  { name: "Đắk Lắk", lat: 12.667, lng: 108.038 },
  { name: "Lâm Đồng", lat: 11.94, lng: 108.458 },

  // Miền Nam
  { name: "TP. Hồ Chí Minh", lat: 10.823, lng: 106.63 },
  { name: "Long An", lat: 10.536, lng: 106.41 },
];

//TEST
const getRiskLevel = (precipitation) => {
  if (precipitation > 0.05) return "critical";
  if (precipitation > 0.02) return "high";
  if (precipitation > 0.01) return "moderate";
  return "safe";
};

//mức độ chuẩn
// const getRiskLevel = (precipitation) => {
//   if (precipitation >= 50) return "critical"; // mưa rất to, lũ lụt
//   if (precipitation >= 25) return "high"; // mưa to
//   if (precipitation >= 10) return "moderate"; // mưa vừa
//   return "safe"; // mưa nhỏ hoặc không mưa
// };

const fetchAndSave = async () => {
  console.log("Running flood data job...");
  for (const loc of locations) {
    try {
      const res = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: loc.lat,
          longitude: loc.lng,
          current: "precipitation,rain",
          forecast_days: 1,
        },
      });
      const precipitation = res.data.current.precipitation || 0;
      const risk_level = getRiskLevel(precipitation);

      await floodDataModel.upsert({
        latitude: loc.lat,
        longitude: loc.lng,
        precipitation_mm: precipitation,
        risk_level,
        location_name: loc.name,
      });

      console.log(` ${loc.name}: ${precipitation}mm → ${risk_level}`);
    } catch (err) {
      console.error(` ${loc.name}:`, err.message);
    }
  }
};

// Chạy ngay khi khởi động
fetchAndSave();

// Chạy mỗi 30 phút
cron.schedule("*/30 * * * *", fetchAndSave);

module.exports = { fetchAndSave };
