const { UserModel } = require("../models/user.model");

const createUser = async (user) => await UserModel.create(user);

const getUserByEmail = async (email) => await UserModel.findOne({ email });

const getUserById = async (id) => await UserModel.findById(id);

const updateUser = async (user) => {
  const { _id, ...rest } = user;
  return await UserModel.findByIdAndUpdate(_id, { ...rest }, { new: true });
};

const deleteUser = async (id) => await UserModel.findByIdAndDelete(id);

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserById,
};
