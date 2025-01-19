const express = require("express");
const {
  register,
  login,
  userUpdate,
  userDelete,
  forgotPassword,
  verifyCode,
  resetPassword,
  getUserStorageSummary,
  uploadUserProfileImage,
} = require("../controllers/user.controller");
const { isUser } = require("../middlewares/isUser");
const { uploadProfileMiddleware } = require("../middlewares/uploadProfile");
const router = express.Router();

router.get("/summary", isUser, getUserStorageSummary);

router.post("/register", register);
router.post("/login", login);
router.put(
  "/update-profile",
  isUser,
  uploadProfileMiddleware,
  uploadUserProfileImage
);
router.put("/update/:userId", isUser, userUpdate);
router.delete("/delete/:userId", isUser, userDelete);

// password api routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.put("/reset-password", resetPassword);

module.exports = router;
