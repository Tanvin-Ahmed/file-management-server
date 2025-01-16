const bcrypt = require("bcrypt");
const {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
} = require("../services/user.service");
const { generateToken } = require("../libs/authToken");

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

    return res
      .status(201)
      .json({ message: "User registered successfully", token });
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

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
};

const userUpdate = async (req, res) => {
  const { userId } = req.params; // User ID from route params
  const { username } = req.body; // Data to update

  try {
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

const userDelete = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await deleteUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

module.exports = { register, login, userUpdate, userDelete };
