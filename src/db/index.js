const mongoose = require("mongoose");
const { config } = require("../config");

const dbConnection = async () => {
  try {
    if (!config.db_uri) {
      console.log("DB URI is required");
      return;
    }

    await mongoose.connect(config.db_uri);
    console.log("Connected to database");
  } catch (error) {
    console.log("Error connecting to MongoDB");
  }
};

module.exports = { dbConnection };
