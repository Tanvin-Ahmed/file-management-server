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
  previewProfile,
} = require("../controllers/user.controller");
const { isUser } = require("../middlewares/isUser");
const { uploadProfileMiddleware } = require("../middlewares/uploadProfile");
const router = express.Router();

router.get("/summary", isUser, getUserStorageSummary);
router.get("/profile-preview", isUser, previewProfile);

router.post("/register", register);
router.post("/login", login);
router.put(
  "/update-profile",
  isUser,
  uploadProfileMiddleware,
  uploadUserProfileImage
);

router.put("/update", isUser, userUpdate);
router.delete("/delete", isUser, userDelete);

// password api routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.put("/reset-password", resetPassword);

module.exports = router;
