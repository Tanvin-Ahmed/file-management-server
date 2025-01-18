const express = require("express");
const { isUser } = require("../middlewares/isUser");
const {
  uploadMultipleFiles,
  deleteFile,
  renameFile,
  copyOrDuplicateFile,
} = require("../controllers/file.controller");
const { uploadMiddleware } = require("../middlewares/uploadFiles");
const { checkFileSizesAndStorage } = require("../middlewares/checkFileSize");
const { favoriteFolder } = require("../controllers/folder.controller");
const router = express.Router();

router.post(
  "/save-files",
  isUser,
  checkFileSizesAndStorage,
  uploadMiddleware,
  uploadMultipleFiles
);
router.post("/copy-or-duplicate-file/:fileId", isUser, copyOrDuplicateFile);
router.put("/rename-file/:fileId", isUser, renameFile);
router.put("/favorite-file/:fileId", isUser, favoriteFolder);
router.delete("/delete-file/:fileId", isUser, deleteFile);

module.exports = router;
