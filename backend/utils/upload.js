const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

function getUploadDestination() {
  const uploadsDir = path.join(__dirname, "../uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    return uploadsDir;
  } catch (_e) {
    return os.tmpdir();
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadDestination()),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
