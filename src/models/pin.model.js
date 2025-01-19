const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    pin: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports.PinModel = mongoose.model("Pin", folderSchema);
