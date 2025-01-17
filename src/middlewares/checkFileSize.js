const { config } = require("../config");
const { getUserById } = require("../services/user.service");
const mongoose = require("mongoose");

// Middleware to check file sizes and storage
const checkFileSizesAndStorage = async (req, res, next) => {
  try {
    // Parse content length (e.g., total size of the incoming files)
    const contentLength = parseInt(req.headers["content-length"] || 0, 10);

    // Limit for user storage (15GB in bytes)
    const userStorageLimit = config.max_storage;

    const user = await getUserById(req.user._id); // Assuming user ID is in req.user
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userUsedStorage = user.usedStorage || 0; // Default to 0 if not set

    // Check if the uploaded files fit within the user's remaining storage
    if (userUsedStorage + contentLength > userStorageLimit) {
      return res.status(400).json({
        error: "Insufficient user storage space for this upload.",
      });
    }

    // Check MongoDB database's free storage (assuming replica sets or `db.stats()`)
    // const dbStats = await mongoose.connection.db.stats();
    // console.log(dbStats);
    // const dbFreeSpace = dbStats.storageSize || 0; // Free storage in bytes

    // if (dbFreeSpace < contentLength) {
    //   return res.status(400).json({
    //     error: "Database has insufficient storage to save these files.",
    //   });
    // }

    // Proceed to the next middleware if all checks pass
    next();
  } catch (error) {
    console.error("Error in checkFileSizesAndStorage middleware:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

module.exports = { checkFileSizesAndStorage };
