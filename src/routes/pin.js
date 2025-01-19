const express = require("express");
const { isUser } = require("../middlewares/isUser");
const {
  unlockPin,
  createPin,
  pinUpdate,
} = require("../controllers/pin.controller");
const router = express.Router();

router.post("/", isUser, unlockPin);
router.post("/create", isUser, createPin);
router.put("/update", isUser, pinUpdate);

module.exports = router;
