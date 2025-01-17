const mongoose = require("mongoose");
const GridFSBucket = mongoose.mongo.GridFSBucket;
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

const fileDelete = async (file, res) => {
  // Initialize GridFSBucket
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  // Delete the file from GridFS
  await bucket.delete(file.fileId);
  return await FileModel.findByIdAndDelete(file._id);
};

module.exports = {
  saveFolder,
  findFolder,
  saveFile,
  findFile,
  updateFolder,
  fileDelete,
};
