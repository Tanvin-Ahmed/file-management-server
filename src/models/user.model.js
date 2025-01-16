const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const model = mongoose.model("User", UserSchema);

module.exports = { UserModel: model };
