const cron = require("node-cron");
const axios = require("axios");
const floodDataModel = require("../models/floodDataModel");

const locations = [
  { name: "Đà Nẵng", lat: 16.047, lng: 108.206 },
  { name: "Huế", lat: 16.463, lng: 107.59 },
  { name: "Quảng Nam", lat: 15.879, lng: 108.335 },
  { name: "Quảng Ngãi", lat: 15.12, lng: 108.792 },
  { name: "Bình Định", lat: 13.782, lng: 109.219 },
  { name: "Quảng Bình", lat: 17.469, lng: 106.622 },
];

const getRiskLevel = (precipitation) => {
  if (precipitation > 0.01) return "critical";
  if (precipitation > 15) return "high";
  if (precipitation > 5) return "moderate";
  return "safe";
};

const fetchAndSave = async () => {
  console.log("🌊 Running flood data job...");
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
