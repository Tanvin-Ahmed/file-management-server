const { saveFolder, findFolder } = require("../services/files.service");

const createFolder = async (req, res) => {
  const userId = req.user._id; // Assuming user ID is available from authentication middleware
  const { folderName, parentFolderId } = req.body;

  try {
    // Validate folderName
    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({
        success: false,
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
        success: false,
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

    res.status(201).json({
      message: "Folder created successfully.",
      folder: newFolder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create folder.",
      error: error.message,
    });
  }
};

module.exports = { createFolder };
