const express = require("express");
const { isUser } = require("../middlewares/isUser");
const {
  uploadMultipleFiles,
  deleteFile,
  renameFile,
  copyFile,
} = require("../controllers/file.controller");
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
router.put("/rename-file/:fileId", isUser, renameFile);
router.post("/copy-file/:fileId", isUser, copyFile);
router.delete("/delete-file/:fileId", isUser, deleteFile);

module.exports = router;
