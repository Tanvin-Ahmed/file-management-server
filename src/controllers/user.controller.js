const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
  findSummery,
  deleteProfileIfExist,
} = require("../services/user.service");
const { generateToken } = require("../libs/authToken");
const { sendMail } = require("../libs/mail/handleMail");
const { config } = require("../config");
const { getDownloadStream } = require("../services/files.service");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = createUser({ username, email, password: hashedPassword });

    //   generate a new token
    const token = generateToken({ email, _id: newUser._id });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      userId: newUser._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = generateToken({ _id: user._id, email });

    return res
      .status(200)
      .json({ message: "Login successful", token, userId: user._id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
};

const userUpdate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.body;

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    const updatedUser = await updateUser({ _id: userId, username });
    return res
      .status(200)
      .json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Update failed", error: error.message });
  }
};

const uploadUserProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    await deleteProfileIfExist(userId);
    const updatedUser = await updateUser({ _id: userId, imageId: file.id });

    return res
      .status(200)
      .json({ message: "Profile change successfully", data: updatedUser });
  } catch (error) {
    console.error("Error in uploadUserProfileImage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userDelete = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await deleteUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a verification code and expiration date
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = Date.now() + 5 * 60 * 1000; // Code valid for 5 minutes

    // update in db
    await updateUser({
      _id: user._id,
      verificationCode,
      verificationCodeExpiry,
    });

    // Send email with the verification code
    const options = {
      to: email,
      subject: "Password Reset Verification Code",
      html: `<p>Your verification code is: ${verificationCode}</p>
      <small style='color:red'>After 5 minutes the code will expired!</small>`,
    };
    await sendMail(options, res);

    return res
      .status(200)
      .json({ message: "Verification code sent to your email" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send verification code",
      error: error.message,
    });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate the verification code and expiry
    const isValidCode =
      user.verificationCode !== code ||
      Date.now() >= user.verificationCodeExpiry;

    if (isValidCode) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    return res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password and confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password also clear verify code and expiration date
    await updateUser({
      _id: user._id,
      password: hashedPassword,
      verificationCode: undefined,
      verificationCodeExpiry: undefined,
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to reset password", error: error.message });
  }
};

const getUserStorageSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const totalStorage = config.max_storage;
    const usedStorage = user.usedStorage;
    const availableStorage = totalStorage - usedStorage;

    const sizeSummery = await findSummery(userId);

    // Respond with summary data
    return res.status(200).json({
      message: "Storage summary retrieved successfully.",
      data: {
        totalStorage,
        usedStorage,
        availableStorage,
        ...sizeSummery,
      },
    });
  } catch (error) {
    console.error("Error retrieving storage summary:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const previewProfile = async (req, res) => {
  try {
    const { imageId } = req.query;

    // Get the download stream and file metadata
    const { downloadStream, file } = await getDownloadStream(
      imageId,
      "profiles"
    );

    // Set appropriate headers
    res.set({
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
    });

    // Pipe the stream to the response
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("Error streaming file:", err.message);
      return res.status(500).json({ message: "Error streaming file" });
    });
  } catch (error) {
    console.error("Error in previewFile:", error.message);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  userUpdate,
  userDelete,
  forgotPassword,
  verifyCode,
  resetPassword,
  getUserStorageSummary,
  uploadUserProfileImage,
  previewProfile,
};
