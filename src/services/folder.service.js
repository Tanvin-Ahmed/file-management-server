const { FileModel } = require("../models/file.model");
const { FolderModel } = require("../models/folder.model");
const {
  findFile,
  saveFile,
  copyFileGridFS,
  findFiles,
  fileDelete,
} = require("./files.service");

const saveFolder = async (folder) => await FolderModel.create(folder);
const findFolder = async (folder) => await FolderModel.findOne(folder);
const findFolders = async (folder) => await FolderModel.find(folder);
const findFolderById = async (id) => await FolderModel.findById(id);

const findFoldersInDescOrder = async (userId, private) => {
  return await FolderModel.find({ createdBy: userId, private }).sort({
    updatedAt: -1,
  });
};

const findRecentFilesAndFolders = async (userId, private) => {
  const recentFiles = await FileModel.find({ createdBy: userId, private })
    .sort({ updatedAt: -1 })
    .limit(10);

  const recentFolders = await FolderModel.find({ createdBy: userId, private })
    .sort({ updatedAt: -1 })
    .limit(10);

  const recentItems = [...recentFiles, ...recentFolders].sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const result = recentItems.slice(0, 10);

  return result;
};

const findItemsOfFolder = async (userId, folderId) => {
  const [files, subfolders] = await Promise.all([
    FileModel.find({ folder: folderId, createdBy: userId }),
    FolderModel.find({ parentFolder: folderId, createdBy: userId }),
  ]);

  const folderContents = [...files, ...subfolders].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return folderContents;
};

const updateFolder = async (folder) => {
  const { _id, ...rest } = folder;
  return await FolderModel.findByIdAndUpdate(_id, { ...rest }, { new: true });
};

const deleteFolderContents = async (folderId) => {
  // Find all subfolders within the folder
  const subfolders = await FolderModel.find({ parentFolder: folderId });

  // Delete each subfolder recursively
  for (const subfolder of subfolders) {
    await deleteFolderContents(subfolder._id);
  }

  // Find all files in the folder
  const files = await FileModel.find({ folder: folderId });

  // Delete each file from GridFS and FileModel
  for (const file of files) {
    try {
      await fileDelete(file);
    } catch (error) {
      console.error(`Error deleting file: ${file.fileId}`, error);
      throw new Error(`Failed to delete file: ${file.fileName}`);
    }
  }

  // Delete the folder itself
  await FolderModel.findByIdAndDelete(folderId);
};

const copyFolderContents = async (
  sourceFolderId,
  destinationParentFolderId,
  userId
) => {
  const sourceFolder = await findFolderById(sourceFolderId);
  if (!sourceFolder) throw new Error("Source folder not found");

  // Ensure unique folder name in the destination
  let newFolderName = sourceFolder.folderName;
  let counter = 0;
  let duplicateFolder;

  do {
    duplicateFolder = await findFolder({
      folderName: newFolderName,
      parentFolder: destinationParentFolderId || null,
      createdBy: userId,
    });

    if (duplicateFolder) {
      counter++;
      newFolderName = `${sourceFolder.folderName} (${counter})`;
    }
  } while (duplicateFolder);

  // Create the copied folder
  const copiedFolder = await saveFolder({
    folderName: newFolderName,
    parentFolder: destinationParentFolderId || null,
    createdBy: userId,
    size: sourceFolder.size,
  });

  // Copy all files in the folder
  const files = await findFiles({ folder: sourceFolderId, createdBy: userId });
  for (const file of files) {
    const newFileName = file.fileName;
    const { newFileId } = await copyFileGridFS(file.fileId, newFileName); // Copy file in GridFS

    await saveFile({
      fileName: newFileName,
      fileId: newFileId,
      folder: copiedFolder._id,
      createdBy: userId,
      fileType: file.fileType,
      fileSize: file.fileSize,
      isFavorite: false,
    });
  }

  // Recursively copy subfolders
  const subfolders = await findFolders({
    parentFolder: sourceFolderId,
    createdBy: userId,
  });
  for (const subfolder of subfolders) {
    await copyFolderContents(subfolder._id, copiedFolder._id, userId);
  }

  return copiedFolder;
};

const updatePrivacy = async (folderId, privateStatus) => {
  // Update the current folder's privacy
  await FolderModel.findByIdAndUpdate(folderId, { private: privateStatus });

  // Update all files in the current folder
  await FileModel.updateMany({ folder: folderId }, { private: privateStatus });

  // Find child folders
  const childFolders = await FolderModel.find({ parentFolder: folderId });

  // Recursively update privacy for child folders
  for (const childFolder of childFolders) {
    await updatePrivacy(childFolder._id, privateStatus);
  }
};

module.exports = {
  findRecentFilesAndFolders,
  saveFolder,
  findFolder,
  updateFolder,
  deleteFolderContents,
  copyFolderContents,
  findFolderById,
  findFoldersInDescOrder,
  findItemsOfFolder,
  updatePrivacy,
};
