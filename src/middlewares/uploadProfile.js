const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const { config } = require("../config");

// Multer storage configuration using GridFS
const storage = new GridFsStorage({
  url: config.db_uri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      if (!file.originalname) return reject(new Error("Upload failed"));

      const fileName = file.originalname;
      const fileInfo = {
        bucketName: "profiles", // Name of the bucket in MongoDB
        filename: fileName,
      };
      resolve(fileInfo);
    });
  },
});

// File filter (only allow images, PDFs, and docs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image, PDF, and doc files are allowed."), false);
  }
};

// Multer middleware
const store = multer({
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max image size set to 2MB
  storage,
});

const uploadProfileMiddleware = (req, res, next) => {
  const upload = store.single("file");
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "File is too large" });
    } else if (err) {
      return res.status(500).json({ message: err.message });
    }
    // all is good
    next();
  });
};
module.exports = { uploadProfileMiddleware };
