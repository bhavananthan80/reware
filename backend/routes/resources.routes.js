const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get("/", authMiddleware, (_req, res) => {
  const db = readDb();
  res.json(db.resources.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post("/", authMiddleware, upload.single("file"), (req, res) => {
  const { title, type, department, sem } = req.body;
  if (!title || !type || !department || !sem) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const db = readDb();
  const resource = {
    id: crypto.randomUUID(),
    title,
    type,
    department,
    sem,
    uploaderId: req.user.studentId,
    fileUrl: req.file ? `/uploads/${req.file.filename}` : "",
    createdAt: new Date().toISOString()
  };
  db.resources.push(resource);
  writeDb(db);
  res.status(201).json(resource);
});

module.exports = router;
