const express = require("express");
const { readDb, writeDb } = require("../utils/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  const db = readDb();
  const student = db.students.find((item) => item.id === req.user.studentId);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json(student);
});

router.put("/me", authMiddleware, upload.single("avatar"), (req, res) => {
  const db = readDb();
  const idx = db.students.findIndex((item) => item.id === req.user.studentId);

  if (idx === -1) {
    return res.status(404).json({ message: "Student not found" });
  }

  const editableFields = ["name", "department", "year", "sem", "phone"];
  editableFields.forEach((field) => {
    if (req.body && req.body[field] !== undefined) {
      db.students[idx][field] = req.body[field];
    }
  });

  if (req.file) {
    db.students[idx].avatarUrl = `/uploads/${req.file.filename}`;
  }

  writeDb(db);
  return res.json(db.students[idx]);
});

module.exports = router;
