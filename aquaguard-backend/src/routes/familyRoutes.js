const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, familyController.getFamily);
router.post("/", authMiddleware, familyController.addMember);
router.delete("/:memberId", authMiddleware, familyController.removeMember);

module.exports = router;
