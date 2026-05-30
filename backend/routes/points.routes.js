const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");
const {
  normalizePointsDb,
  getLeaderboard,
  getCertificate,
  CERTIFICATE_THRESHOLD,
  checkCertificates
} = require("../utils/points");

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  const db = readDb();
  normalizePointsDb(db);
  const student = db.students.find((s) => s.id === req.user.studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const myCerts = (db.certificates || []).filter((c) => c.studentId === student.id);
  const board = getLeaderboard(db, 100);
  const myRank = board.findIndex((r) => r.id === student.id) + 1;

  res.json({
    sustainabilityPoints: student.sustainabilityPoints || 0,
    carbonSavedKg: student.carbonSavedKg || 0,
    rank: myRank || null,
    certificateThreshold: CERTIFICATE_THRESHOLD,
    certificates: myCerts,
    recentEvents: (db.pointEvents || [])
      .filter((e) => e.studentId === student.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 15)
  });
});

router.get("/leaderboard", authMiddleware, (req, res) => {
  const db = readDb();
  normalizePointsDb(db);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  res.json({
    leaderboard: getLeaderboard(db, limit),
    certificateThreshold: CERTIFICATE_THRESHOLD
  });
});

router.get("/certificates/:certId", authMiddleware, (req, res) => {
  const db = readDb();
  const cert = getCertificate(db, req.params.certId);
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  res.json(cert);
});

module.exports = router;
