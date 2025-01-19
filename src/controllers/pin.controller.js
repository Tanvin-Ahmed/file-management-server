const bcrypt = require("bcrypt");
const {
  findPinByUserId,
  updatePin,
  savePin,
} = require("../services/pin.service");

const createPin = async (req, res) => {
  try {
    const userId = req.user._id;
    const pin = req.body?.pin;

    if (!pin) {
      return res.status(400).json({ message: "Pin is required." });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res
        .status(400)
        .json({ message: "Invalid PIN format. Use a 4-digit PIN." });
    }

    const existingPin = await findPinByUserId(userId);
    if (existingPin) {
      return res.status(409).json({
        message:
          "User pin already exist. If you forgot the pin then click forgot pin and setup a new pin",
      });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await savePin({ createdBy: userId, pin: hashedPin });

    return res
      .status(201)
      .json({ message: "New pin is created successfully!" });
  } catch (error) {
    console.log("Error saving pin: " + error.message);
    return res.status(500).json({
      message: "Something went wrong saving the pin, please try again",
    });
  }
};

const pinUpdate = async (req, res) => {
  try {
    const userId = req.user._id;
    const pin = req.body?.pin;

    if (!pin) {
      return res.status(400).json({ message: "Pin is required." });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res
        .status(400)
        .json({ message: "Invalid PIN format. Use a 4-digit PIN." });
    }

    const existingPin = await findPinByUserId(userId);
    if (existingPin) {
      // then update the existing pin with the new pin
      // this is for forgot pin purposes only
      const hashedPin = await bcrypt.hash(pin, 10);

      await updatePin({ _id: existingPin._id, pin: hashedPin });

      return res
        .status(200)
        .json({ message: "New pin is updated successfully!" });
    }

    return res
      .status(404)
      .json({ message: "Pin not created yet! Please create a pin." });
  } catch (error) {
    console.log("Error updating pin: " + error.message);
    return res.status(500).json({
      message: "Something went wrong update the pin, please try again",
    });
  }
};

const unlockPin = async (req, res) => {
  try {
    const userId = req.user._id;
    const pin = req.body?.pin;

    if (!pin) {
      return res.status(400).json({
        message: "Pin is required. Please provide a 4 digit pin number.",
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res
        .status(400)
        .json({ message: "Invalid PIN format. Use a 4-digit PIN." });
    }

    const userPin = await findPinByUserId(userId);

    if (!userPin) {
      return res.status(404).json({ message: "Please set a pin first." });
    }

    const isValidPin = await bcrypt.compare(pin, userPin.pin);

    if (isValidPin) {
      return res.status(200).json({ message: "Unlocked successful" });
    }

    return res.status(404).json({
      message: "Pin is not correct. Please try with valid pin number.",
    });
  } catch (error) {
    console.log("Error unlock pin: " + error.message);
    return res.status(500).json({
      message: "Something went wrong in unlock, please try again",
    });
  }
};

module.exports = { createPin, pinUpdate, unlockPin };
