const {
  saveFile,
  findFile,
  findFolder,
  updateFolder,
} = require("../services/files.service");
const { getUserById, updateUser } = require("../services/user.service");

const uploadMultipleFiles = async (req, res) => {
  const userId = req.user._id; // Assuming user ID is available from authentication middleware
  const files = req.files; // Multer adds the files array to the request
  const { folderId } = req.body; // Folder ID to specify the upload location

  try {
    // Validate input
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided for upload.",
      });
    }

    // Check if folderId exists (if provided)
    if (folderId) {
      const folder = await findFolder({ _id: folderId, createdBy: userId });
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Specified folder does not exist.",
        });
      }
    }

    // Save file metadata and handle duplicate file names
    const uploadedFiles = [];
    for (const file of files) {
      let originalFileName = file.originalname;
      let fileName = originalFileName;
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));
      const baseName = fileName.substring(0, fileName.lastIndexOf("."));

      // Check for duplicate file names
      let counter = 0;
      let duplicateFile;
      do {
        duplicateFile = await findFile({
          fileName: fileName,
          createdBy: userId,
          folder: folderId || null, // Ensure uniqueness per folder or root
        });
        if (duplicateFile) {
          counter++;
          fileName = `${baseName} (${counter})${fileExtension}`;
        }
      } while (duplicateFile);

      // Save the file metadata (including file ID from Multer)
      const fileMetadata = {
        fileId: JSON.parse(JSON.stringify(file.id)), // Multer-generated file ID
        fileName,
        fileType: file.mimetype,
        fileSize: file.size,
        createdBy: userId,
        folder: folderId || null, // Set folderId or null for root directory
      };

      const newFile = await saveFile(fileMetadata);
      uploadedFiles.push(newFile);
    }

    // Update user's used storage
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);
    const user = await getUserById(userId);
    await updateUser({
      _id: userId,
      usedStorage: user.usedStorage + totalUploadSize, // Add to the existing value
    });

    // if file created inside a folder, then update folder size
    if (folderId) {
      const folder = await findFolder({ _id: folderId, createdBy: userId });
      await updateFolder({
        _id: folderId,
        size: folder.size + totalUploadSize,
      });
    }

    res.status(201).json({
      message: "Files uploaded successfully.",
      files: uploadedFiles,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload files.",
      error: error.message,
    });
  }
};

module.exports = { uploadMultipleFiles };
