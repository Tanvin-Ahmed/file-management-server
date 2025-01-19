const { PinModel } = require("../models/pin.model");

const savePin = async (info) => await PinModel.create(info);

const findPinByUserId = async (userId) => {
  return await PinModel.findOne({ createdBy: userId });
};

const updatePin = async (info) => {
  const { _id, pin } = info;
  return await PinModel.findByIdAndUpdate(_id, { pin }, { new: true });
};

module.exports = { savePin, findPinByUserId, updatePin };
