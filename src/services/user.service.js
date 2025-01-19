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
  // Calculate total folder size
  const totalFolderSize = await FolderModel.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalSize: { $sum: "$size" } } },
  ]);

  const folderSize = totalFolderSize[0]?.totalSize || 0;

  // calculate all type of file size
  const fileAggregations = await FileModel.aggregate([
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
        pdfFileSize: {
          $sum: {
            $cond: [{ $eq: ["$fileType", "application/pdf"] }, "$fileSize", 0],
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
      },
    },
  ]);

  const { _id, ...rest } = fileAggregations[0];
  const fileSummary = rest || {
    imageFileSize: 0,
    pdfFileSize: 0,
    noteFileSize: 0,
  };

  return { folderSize, ...fileSummary };
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
