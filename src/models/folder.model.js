const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    folderName: { type: String, required: true },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    size: {
      type: Number,
      default: 0,
    },
    private: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports.FolderModel = mongoose.model("Folder", folderSchema);
