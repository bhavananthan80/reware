const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { readDb, writeDb } = require("../utils/db");
const { SECRET } = require("../middleware/auth.middleware");
const { normalizeEmail, isValidCollegeEmail } = require("../utils/collegeEmail");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, name, regNo, department, year, sem } = req.body;

  if (!email || !name || !regNo || !department || !year || !sem) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailNorm = normalizeEmail(email);
  if (!isValidCollegeEmail(emailNorm)) {
    return res.status(400).json({
      message:
        "Use your official Rajalakshmi college email (e.g. bhavananthan.250013@csbs.ritchennai.edu.in)."
    });
  }

  const db = readDb();
  let student = db.students.find((item) => normalizeEmail(item.email) === emailNorm);

  if (!student) {
    student = {
      id: crypto.randomUUID(),
      email: emailNorm,
      name,
      regNo,
      department,
      year,
      sem,
      createdAt: new Date().toISOString()
    };
    db.students.push(student);
    writeDb(db);
  }

  const token = jwt.sign(
    { studentId: student.id, email: student.email },
    SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token, student });
});

module.exports = router;
