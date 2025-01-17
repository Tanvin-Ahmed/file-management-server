const express = require("express");
const {
  register,
  login,
  userUpdate,
  userDelete,
  forgotPassword,
  verifyCode,
  resetPassword,
} = require("../controllers/user.controller");
const { isUser } = require("../middlewares/isUser");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/update/:userId", isUser, userUpdate);
router.delete("/delete/:userId", isUser, userDelete);

// password api routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.put("/reset-password", resetPassword);

module.exports = router;
