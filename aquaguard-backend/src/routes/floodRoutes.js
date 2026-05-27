// src/routes/floodRoutes.js
const express = require("express");
const router = express.Router();
const floodDataModel = require("../models/floodDataModel");
const { successResponse } = require("../utils/response");

router.get("/", async (req, res, next) => {
  try {
    const data = await floodDataModel.findAll();
    return successResponse(res, data, "Lấy dữ liệu lũ thành công!");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
