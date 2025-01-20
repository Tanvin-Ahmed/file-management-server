const mongoose = require("mongoose");
const { FileModel } = require("../models/file.model");
const { FolderModel } = require("../models/folder.model");
const { UserModel } = require("../models/user.model");

const createUser = async (user) => await UserModel.create(user);

const getUserByEmail = async (email) => await UserModel.findOne({ email });

const getUserById = async (id) => await UserModel.findById(id);

const updateUser = async (user) => {
  const { _id, ...rest } = user;
  return await UserModel.findByIdAndUpdate(_id, { ...rest }, { new: true });
};

const deleteProfileIfExist = async (userId) => {
  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "profiles",
  });

  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Delete the previous image if it exists
  if (user.imageId) {
    await bucket.delete(new mongoose.Types.ObjectId(user.imageId));
  }
};

const deleteUser = async (id) => await UserModel.findByIdAndDelete(id);

const findSummery = async (userId) => {
  // Calculate total folder size and count
  const folderAggregation = await FolderModel.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSize: { $sum: "$size" },
        totalFolders: { $sum: 1 },
      },
    },
  ]);

  const folderSummary = {
    folderSize: folderAggregation[0]?.totalSize || 0,
    totalFolders: folderAggregation[0]?.totalFolders || 0,
  };

  // Calculate total size and count for each file type
  const fileAggregation = await FileModel.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        imageFileSize: {
          $sum: {
            $cond: [
              { $regexMatch: { input: "$fileType", regex: /^image\// } },
              "$fileSize",
              0,
            ],
          },
        },
        imageFileCount: {
          $sum: {
            $cond: [
              { $regexMatch: { input: "$fileType", regex: /^image\// } },
              1,
              0,
            ],
          },
        },
        pdfFileSize: {
          $sum: {
            $cond: [{ $eq: ["$fileType", "application/pdf"] }, "$fileSize", 0],
          },
        },
        pdfFileCount: {
          $sum: {
            $cond: [{ $eq: ["$fileType", "application/pdf"] }, 1, 0],
          },
        },
        noteFileSize: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$fileType",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ],
              },
              "$fileSize",
              0,
            ],
          },
        },
        noteFileCount: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$fileType",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const { _id, ...rest } = fileAggregation[0];

  const fileSummary = rest || {
    imageFileSize: 0,
    imageFileCount: 0,
    pdfFileSize: 0,
    pdfFileCount: 0,
    noteFileSize: 0,
    noteFileCount: 0,
  };

  return { ...folderSummary, ...fileSummary };
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  findSummery,
  deleteProfileIfExist,
};
