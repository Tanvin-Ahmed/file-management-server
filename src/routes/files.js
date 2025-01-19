const express = require("express");
const { isUser } = require("../middlewares/isUser");
const {
  uploadMultipleFiles,
  deleteFile,
  renameFile,
  copyOrDuplicateFile,
  getNotes,
  getPdfFiles,
  geImageFiles,
  getFavoriteItems,
  favoriteFile,
  getItemsByDate,
  previewFile,
  updateFilePrivacy,
} = require("../controllers/file.controller");
const { uploadMiddleware } = require("../middlewares/uploadFiles");
const { checkFileSizesAndStorage } = require("../middlewares/checkFileSize");
const router = express.Router();

router.get("/notes", isUser, getNotes);
router.get("/pdfs", isUser, getPdfFiles);
router.get("/images", isUser, geImageFiles);
router.get("/favorite", isUser, getFavoriteItems);
router.get("/items-by-date", isUser, getItemsByDate);
router.get("/preview-file", isUser, previewFile);

router.post(
  "/save-files",
  isUser,
  checkFileSizesAndStorage,
  uploadMiddleware,
  uploadMultipleFiles
);
router.post("/copy-or-duplicate-file/:fileId", isUser, copyOrDuplicateFile);

router.put("/rename-file/:fileId", isUser, renameFile);
router.put("/favorite-file/:fileId", isUser, favoriteFile);
router.put("/privacy-update", isUser, updateFilePrivacy);

router.delete("/delete-file/:fileId", isUser, deleteFile);

module.exports = router;
