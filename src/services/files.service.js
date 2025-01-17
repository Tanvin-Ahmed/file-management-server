const { FileModel } = require("../models/file.model");
const { FolderModel } = require("../models/folder.model");

const saveFolder = async (folder) => await FolderModel.create(folder);
const findFolder = async (folder) => await FolderModel.findOne(folder);
const updateFolder = async (folder) => {
  const { _id, ...rest } = folder;
  return await FolderModel.findByIdAndUpdate(_id, { ...rest }, { new: true });
};

const saveFile = async (fileData) => await FileModel.create(fileData);
const findFile = async (file) => await FileModel.findOne(file);

module.exports = {
  saveFolder,
  findFolder,
  saveFile,
  findFile,
  updateFolder,
};
