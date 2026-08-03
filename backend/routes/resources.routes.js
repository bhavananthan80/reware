const express = require("express");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");
const { awardPoints } = require("../utils/points");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const db = readDb();
  const q = (req.query.q || "").trim().toLowerCase();
  let list = db.resources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) {
    list = list.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.type || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q) ||
        String(r.sem || "").toLowerCase().includes(q)
    );
  }
  res.json(list);
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
  awardPoints(db, req.user.studentId, "RESOURCE_UPLOAD");
  writeDb(db);
  res.status(201).json(resource);
});

module.exports = router;
