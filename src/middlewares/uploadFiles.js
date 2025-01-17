const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const { config } = require("../config");

// Multer storage configuration using GridFS
const storage = new GridFsStorage({
  url: config.db_uri,
  // file: (req, file) => {
  //   return new Promise((resolve, reject) => {
  //     if (!file.originalname) return reject(new Error("Upload failed"));

  //     const fileName = file.originalname;
  //     const fileInfo = {
  //       bucketName: "uploads", // Name of the bucket in MongoDB
  //       filename: fileName,
  //     };
  //     resolve(fileInfo);
  //   });
  // },
});

// File filter (only allow images, PDFs, and docs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "application/msword"];
  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image, PDF, and doc files are allowed."), false);
  }
};

// Multer middleware
const store = multer({
  fileFilter,
  limits: { fileSize: config.max_storage }, // Max file size set to 15GB
  storage,
});

const uploadMiddleware = (req, res, next) => {
  const upload = store.array("files");
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
module.exports = { uploadMiddleware };
