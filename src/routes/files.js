const express = require("express");
const { isUser } = require("../middlewares/isUser");
const { uploadMultipleFiles } = require("../controllers/file.controller");
const { uploadMiddleware } = require("../middlewares/uploadFiles");
const { checkFileSizesAndStorage } = require("../middlewares/checkFileSize");
const router = express.Router();

router.post(
  "/save-files",
  isUser,
  checkFileSizesAndStorage,
  uploadMiddleware,
  uploadMultipleFiles
);

module.exports = router;
