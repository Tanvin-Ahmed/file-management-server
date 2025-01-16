const apiVersionCheck = (version) => (req, res, next) => {
  const isCorrectVersion = req.path.startsWith(`/api/${version}`);

  if (isCorrectVersion) {
    next();
  } else {
    return res.status(404).json({
      success: false,
      error: "API version is not supported",
    });
  }
};

module.exports = { apiVersionCheck };
