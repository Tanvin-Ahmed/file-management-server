const express = require("express");
const { isUser } = require("../middlewares/isUser");
const {
  createFolder,
  favoriteFolder,
  renameFolder,
  deleteFolder,
  copyOrDuplicateFolder,
  getRecentItems,
  getUserFolders,
} = require("../controllers/folder.controller");
const router = express.Router();

router.get("/all", isUser, getUserFolders);
router.get("/recent-items", isUser, getRecentItems);

router.post("/create", isUser, createFolder);
router.post("/copy-or-duplicate-folder", isUser, copyOrDuplicateFolder);

router.put("/favorite-folder/:folderId", isUser, favoriteFolder);
router.put("/rename-folder/:folderId", isUser, renameFolder);

router.delete("/delete-folder/:folderId", isUser, deleteFolder);

module.exports = router;
