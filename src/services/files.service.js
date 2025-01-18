const mongoose = require("mongoose");
const { Readable } = require("stream");
const GridFSBucket = mongoose.mongo.GridFSBucket;
const { FileModel } = require("../models/file.model");

const saveFile = async (fileData) => await FileModel.create(fileData);
const findFile = async (file) => await FileModel.findOne(file);
const findFiles = async (file) => await FileModel.find(file);

const updateFile = async (folder) => {
  const { _id, ...rest } = folder;
  return await FileModel.findByIdAndUpdate(_id, { ...rest }, { new: true });
};

const gridFSfileRename = async (fileId, newFileName) => {
  const db = mongoose.connection.db;
  const filesCollection = db.collection("uploads.files"); // Ensure the bucket name matches your setup

  // Check if the file exists in GridFS
  const file = await filesCollection.findOne({
    _id: fileId,
  });
  if (!file) {
    throw new Error("File not found.");
  }

  // Update the filename in the `fs.files` collection
  return await filesCollection.updateOne(
    { _id: fileId },
    { $set: { filename: newFileName, "metadata.fileName": newFileName } }
  );
};

const copyFileGridFS = async (fileId, fileName) => {
  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "uploads",
  });

  // Fetch the original file metadata
  const originalFile = await db
    .collection("uploads.files")
    .findOne({ _id: new mongoose.Types.ObjectId(fileId) });

  if (!originalFile) {
    throw new Error("Original file not found.");
  }

  return new Promise((resolve, reject) => {
    // Open a download stream for the original file
    const downloadStream = bucket.openDownloadStream(originalFile._id);

    // Read the original file content into memory
    const fileChunks = [];
    downloadStream.on("data", (chunk) => {
      fileChunks.push(chunk);
    });

    downloadStream.on("end", async () => {
      try {
        // Combine all chunks into a single buffer
        const fileBuffer = Buffer.concat(fileChunks);

        // Create a readable stream from the buffer
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null); // Signal the end of the stream

        // Upload the copied file with the new filename
        const uploadStream = bucket.openUploadStream(fileName, {
          metadata: {
            ...originalFile.metadata, // Retain original metadata
          },
          contentType: originalFile.contentType, // Retain content type
        });

        readableStream.pipe(uploadStream).on("finish", () => {
          resolve({
            message: "File copied successfully.",
            newFileId: uploadStream.id,
            newFileName: fileName,
          });
        });

        uploadStream.on("error", (error) => {
          console.error("Error copying file:", error);
          reject(new Error("Internal Server Error."));
        });
      } catch (error) {
        reject(error);
      }
    });

    downloadStream.on("error", (error) => {
      console.error("Error reading original file:", error);
      reject(new Error("Internal Server Error."));
    });
  });
};

const fileDelete = async (file) => {
  // Initialize GridFSBucket
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  // Delete the file from GridFS
  await bucket.delete(file.fileId);
  return await FileModel.findByIdAndDelete(file._id);
};

module.exports = {
  saveFile,
  findFile,
  fileDelete,
  gridFSfileRename,
  updateFile,
  copyFileGridFS,
  findFiles,
};
