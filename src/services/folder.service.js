const { FolderModel } = require("../models/folder.model");
const {
  findFile,
  saveFile,
  copyFileGridFS,
  findFiles,
} = require("./files.service");

const saveFolder = async (folder) => await FolderModel.create(folder);
const findFolder = async (folder) => await FolderModel.findOne(folder);
const findFolders = async (folder) => await FolderModel.find(folder);
const findFolderById = async (id) => await FolderModel.findById(id);

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

  // Delete all files in the folder
  await FileModel.deleteMany({ folder: folderId });

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

module.exports = {
  saveFolder,
  findFolder,
  updateFolder,
  deleteFolderContents,
  copyFolderContents,
  findFolderById,
};
