const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "fs.files",
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          const allowedTypes = ["application/pdf", "application/msword"];
          return allowedTypes.includes(value) || /^image\/.+$/.test(value);
        },
        message: (props) => `${props.value} is not a valid file type.`,
      },
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports.FileModel = mongoose.model("File", fileSchema);
