const {
  saveFile,
  findFile,
  findFolder,
  updateFolder,
  fileDelete,
  updateFile,
  gridFSfileRename,
  copyFileGridFS,
} = require("../services/files.service");
const { getUserById, updateUser } = require("../services/user.service");
const path = require("path");

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

    return res.status(201).json({
      message: "Files uploaded successfully.",
      files: uploadedFiles,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload files.",
      error: error.message,
    });
  }
};

const renameFile = async (req, res) => {
  try {
    const user = req.user;
    const { fileId } = req.params;
    const { newFileName } = req.body;

    if (!fileId || !newFileName) {
      return res
        .status(400)
        .json({ message: "File ID and new file name are required." });
    }

    const file = await findFile({ _id: fileId, createdBy: user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found!" });
    }

    // extract extension of file
    const ext = path.extname(file.fileName);
    // update in db
    await updateFile({ _id: file._id, fileName: `${newFileName}${ext}` });

    // update in gridfs db
    await gridFSfileRename(file.fileId, `${newFileName}${ext}`);

    return res.status(200).json({ message: "File renamed successfully." });
  } catch (error) {
    console.error("Error renaming file:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

const copyFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;
    const { folderId } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required." });
    }

    const file = await findFile({ _id: fileId, createdBy: userId });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Extract base filename (without count or extension)
    const originalName = file.fileName;
    const fileExtension = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";
    const baseName = originalName.replace(fileExtension, "");

    // Generate a unique filename with a counter
    let counter = 0;
    let duplicateFile;
    let fileName = originalName;

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

    // copy file in gfs
    const copyFileGFS = await copyFileGridFS(file.fileId, fileName);

    // Save the file metadata (including file ID from Multer)
    const fileMetadata = {
      fileId: copyFileGFS.newFileId,
      fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      createdBy: userId,
      folder: folderId || null, // Set folderId or null for root directory
    };
    const newFile = await saveFile(fileMetadata);

    // if file inside a folder then increment the size of the folder
    if (folderId) {
      const folder = await findFolder({ _id: file.folder, createdBy: userId });
      await updateFolder({
        _id: file.folder,
        size: folder.size + file.fileSize,
      });
    }

    return res
      .status(201)
      .json({ message: "File copied successfully!", data: newFile });
  } catch (error) {
    console.error("Error in copyFile controller:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error.", error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params; // Assuming the file ID is passed as a route parameter
    const user = req.user;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required." });
    }

    // Check if the file exists in the database
    const file = await findFile({ _id: fileId, createdBy: user._id });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    if (file.folder) {
      const folder = await findFolder({
        _id: file.folder,
        createdBy: user._id,
      });
      await updateFolder({
        _id: file.folder,
        size: folder.size - file.fileSize,
      });
    }

    const deletedFile = await fileDelete(file);

    return res
      .status(200)
      .json({ message: "File deleted successfully.", data: deletedFile });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "File not deleted.", error: error.message });
  }
};

module.exports = { uploadMultipleFiles, deleteFile, renameFile, copyFile };
