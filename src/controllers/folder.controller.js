const mongoose = require("mongoose");
const {
  saveFolder,
  findFolder,
  updateFolder,
  deleteFolderContents,
  copyFolderContents,
  findFolderById,
} = require("../services/folder.service");
const { getUserById, updateUser } = require("../services/user.service");

const createFolder = async (req, res) => {
  const userId = req.user._id;
  const { folderName, parentFolderId } = req.body;

  try {
    // Validate folderName
    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({
        message: "Folder name is required.",
      });
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await findFolder({
      createdBy: userId,
      folderName,
      parentFolder: parentFolderId || null,
    });

    if (existingFolder) {
      return res.status(400).json({
        message:
          "A folder with this name already exists in the specified location.",
      });
    }

    // Create the folder
    const newFolder = await saveFolder({
      folderName,
      parentFolder: parentFolderId || null,
      createdBy: userId,
    });

    return res.status(201).json({
      message: "Folder created successfully.",
      folder: newFolder,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create folder.",
      error: error.message,
    });
  }
};

const favoriteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const user = req.user;
    const { isFavorite } = req.body;

    if (!folderId) {
      return res.status(400).json({ message: "File ID is required" });
    }

    if (isFavorite === undefined) {
      return res
        .status(400)
        .json({ message: "Need to provide isFavorite property" });
    }

    const file = await findFolder({ _id: folderId, createdBy: user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const updatedFolder = await updateFolder({
      _id: folderId,
      isFavorite,
    });

    return res.status(200).json({
      message: "Folder marked as favorite successfully",
      data: updatedFolder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const renameFolder = async (req, res) => {
  try {
    const user = req.user;
    const { folderId } = req.params;
    const { newFolderName } = req.body;

    if (!folderId || !newFolderName) {
      return res
        .status(400)
        .json({ message: "Folder ID and new folder name are required." });
    }

    const folder = await findFolder({ _id: folderId, createdBy: user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found!" });
    }

    // update in db
    await updateFolder({ _id: folder._id, folderName: newFolderName });

    return res.status(200).json({ message: "Folder renamed successfully." });
  } catch (error) {
    console.error("Error renaming folder:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

const copyOrDuplicateFolder = async (req, res) => {
  try {
    const { folderId, destinationParentFolderId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ message: "Invalid source folder ID" });
    }

    if (destinationParentFolderId === undefined) {
      return res
        .status(400)
        .json({ message: "Destination parent folder ID will string or null" });
    }

    // Verify source folder exists and belongs to the user
    const sourceFolder = await findFolder({ _id: folderId, createdBy: userId });
    if (!sourceFolder) {
      return res.status(404).json({ message: "Source folder not found" });
    }

    // Perform the recursive copy operation
    const copiedFolder = await copyFolderContents(
      folderId,
      destinationParentFolderId,
      userId
    );

    // if folder copy or duplicate inside another folder then parent folder size need to update
    if (destinationParentFolderId) {
      const destinationFolder = await findFolder({
        _id: destinationParentFolderId,
        createdBy: userId,
      });
      await updateFolder({
        _id: destinationFolder._id,
        size: destinationFolder.size + copiedFolder.size,
      });
    }

    // update size in user
    const user = await getUserById(userId);
    await updateUser({
      _id: userId,
      usedStorage: user.usedStorage + copiedFolder.size,
    });

    return res.status(201).json({
      message: "Folder copied successfully",
      data: copiedFolder,
    });
  } catch (error) {
    console.error("Error copying folder:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user._id;

    if (!folderId) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    const folder = await findFolder({ _id: folderId, createdBy: userId });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Recursively delete the folder and its contents
    await deleteFolderContents(folderId);

    // if parent folder exists, then decrease the size of parent folder
    if (folder.parentFolder) {
      const parentFolder = await findFolder({
        _id: folder.parentFolder,
        createdBy: userId,
      });

      await updateFolder({
        _id: parentFolder._id,
        size: parentFolder.size - folder.size,
      });
    }

    // update size in user
    const user = await getUserById(userId);
    await updateUser({
      _id: userId,
      usedStorage: user.usedStorage - folder.size,
    });

    return res
      .status(200)
      .json({ message: "Folder and its contents deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createFolder,
  favoriteFolder,
  renameFolder,
  deleteFolder,
  copyOrDuplicateFolder,
};
