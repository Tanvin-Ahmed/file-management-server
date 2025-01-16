const jwt = require("jsonwebtoken");
const { config } = require("../config");

const isUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret); // Verify the token
    req.user = decoded; // Attach decoded user data to request object
    next(); // Proceed to the next middleware or route
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { isUser };
