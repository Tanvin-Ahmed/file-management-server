const {
  saveFile,
  findFile,
  fileDelete,
  updateFile,
  gridFSfileRename,
  copyFileGridFS,
  findFilesByFileType,
  findAllImages,
  findAllFavorites,
  findItemsByDate,
  findItemsOfFolder,
  getDownloadStream,
  findFileById,
} = require("../services/files.service");
const { findFolder, updateFolder } = require("../services/folder.service");
const { getUserById, updateUser } = require("../services/user.service");
const path = require("path");

const uploadMultipleFiles = async (req, res) => {
  const userId = req.user._id;
  const files = req.files;
  const { folderId } = req.body;

  try {
    // Validate input
    if (!files || files.length === 0) {
      return res.status(400).json({
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
      usedStorage: user.usedStorage + totalUploadSize,
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

const copyOrDuplicateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;

    if (req.body?.folderId === undefined) {
      return res
        .status(400)
        .json({ message: "Folder ID must be string or null." });
    }

    const { folderId } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required." });
    }

    const file = await findFile({ _id: fileId, createdBy: userId });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // if root folder then check is file is public or private
    if (folderId === null && file.private) {
      return res.status(400).json({
        message:
          "Root directory is a public directory. But you want to copy a private file to a public directory.",
      });
    }

    // if not root folder then check is file and folder privateStatus is same or different
    if (folderId) {
      const folder = await findFolder({ _id: folderId, createdBy: userId });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
      }

      if (file.private !== folder.private) {
        return res.status(400).json({
          message:
            "Private file is not allowed to copy in a public folder. Or Public file is not allow to copy in private folder.",
        });
      }
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
      private: file.private,
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

    // update usedStorage in user information
    const user = await getUserById(userId);
    await updateUser({
      _id: user._id,
      usedStorage: user.usedStorage + file.fileSize,
    });

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

const favoriteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;
    const { isFavorite } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required" });
    }

    if (isFavorite === undefined) {
      return res
        .status(400)
        .json({ message: "Need to provide isFavorite property" });
    }

    const file = await findFile({ _id: fileId, createdBy: user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const updatedFile = await updateFile({
      _id: fileId,
      isFavorite,
    });

    return res.status(200).json({
      message: "File marked as favorite successfully",
      data: updatedFile,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params; // Assuming the file ID is passed as a route parameter
    const userId = req.user._id;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required." });
    }

    // Check if the file exists in the database
    const file = await findFile({ _id: fileId, createdBy: userId });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const deletedFile = await fileDelete(file);

    // minus the size form usedStorage
    const user = await getUserById(userId);
    await updateUser({
      _id: userId,
      usedStorage: user.usedStorage - file.fileSize,
    });

    // minus size from folder if folder exists
    if (file.folder) {
      const folder = await findFolder({
        _id: file.folder,
        createdBy: userId,
      });
      await updateFolder({
        _id: file.folder,
        size: folder.size - file.fileSize,
      });
    }

    return res
      .status(200)
      .json({ message: "File deleted successfully.", data: deletedFile });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "File not deleted.", error: error.message });
  }
};

const getNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const private = req.query?.private;

    if (private === undefined) {
      return res.status(400).json({ message: "Private status is required." });
    }

    const notes = await findFilesByFileType({
      createdBy: userId,
      fileType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      private,
    });

    return res.status(200).json({
      message: "Word documents retrieved successfully.",
      data: notes,
    });
  } catch (error) {
    console.error("Error retrieving Word documents:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getPdfFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const private = req.query?.private;

    if (private === undefined) {
      return res.status(400).json({ message: "Private status is required." });
    }

    const pdfs = await findFilesByFileType({
      createdBy: userId,
      fileType: "application/pdf",
      private,
    });

    return res.status(200).json({
      message: "PDF files retrieved successfully.",
      data: pdfs,
    });
  } catch (error) {
    console.error("Error retrieving PDF files:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const geImageFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const private = req.query?.private;

    if (private === undefined) {
      return res.status(400).json({ message: "Private status is required." });
    }

    const images = await findFilesByFileType({
      fileType: { $regex: /^image\// }, // Match all types starting with "image/"
      createdBy: userId,
      private,
    });

    return res.status(200).json({
      message: "image files retrieved successfully.",
      data: images,
    });
  } catch (error) {
    console.error("Error retrieving image files:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getFavoriteItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const private = req.query?.private;

    if (private === undefined) {
      return res.status(400).json({ message: "Private status is required." });
    }

    const allFavorites = await findAllFavorites(userId, private);

    return res.status(200).json({
      message: "Favorite items retrieved successfully.",
      data: allFavorites,
    });
  } catch (error) {
    console.error("Error retrieving favorite items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getItemsByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, private } = req.query;

    if (private === undefined) {
      return res.status(400).json({ message: "Private status is required." });
    }

    if (!date) {
      return res.status(400).json({ message: "Date are required." });
    }

    const items = await findItemsByDate(userId, date, private);

    return res.status(200).json({
      message: "Items retrieved successfully.",
      data: items,
    });
  } catch (error) {
    console.error("Error retrieving items by date:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const previewFile = async (req, res) => {
  try {
    const { fileId } = req.query;

    // Get the download stream and file metadata
    const { downloadStream, file } = await getDownloadStream(fileId, "uploads");

    // Set appropriate headers
    res.set({
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
    });

    // Pipe the stream to the response
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("Error streaming file:", err.message);
      res.status(500).json({ message: "Error streaming file" });
    });
  } catch (error) {
    console.error("Error in previewFile:", error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const updateFilePrivacy = async (req, res) => {
  try {
    const { fileId, privateStatus } = req.body;

    if (typeof privateStatus !== "boolean") {
      return res.status(400).json({ message: "Invalid private status value." });
    }

    // Find the file by ID
    const file = await findFileById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Update the file's privacy
    await updateFile({ _id: file._id, private: privateStatus });

    res.status(200).json({
      message: `File has been made ${privateStatus ? "private" : "public"}.`,
    });
  } catch (error) {
    console.error("Error updating file privacy:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  uploadMultipleFiles,
  deleteFile,
  renameFile,
  copyOrDuplicateFile,
  favoriteFile,
  getNotes,
  getPdfFiles,
  geImageFiles,
  getFavoriteItems,
  getItemsByDate,
  previewFile,
  updateFilePrivacy,
};
