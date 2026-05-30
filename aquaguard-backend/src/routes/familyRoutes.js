const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, familyController.getFamily);
router.post("/search", authMiddleware, familyController.searchByPhone);
router.post("/invite", authMiddleware, familyController.sendInvite);
router.get("/invites", authMiddleware, familyController.getInvites);
router.post(
  "/invites/:inviteId/accept",
  authMiddleware,
  familyController.acceptInvite,
);
router.post(
  "/invites/:inviteId/reject",
  authMiddleware,
  familyController.rejectInvite,
);
router.delete("/:memberId", authMiddleware, familyController.removeMember);

module.exports = router;
