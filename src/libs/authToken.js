const jwt = require("jsonwebtoken");
const { config } = require("../config");

const generateToken = (payload) => {
  const options = { expiresIn: "7d" };
  return jwt.sign(payload, config.jwt_secret, options);
};

module.exports = { generateToken };
