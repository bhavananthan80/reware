const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");
const { normalizeNotificationsDb } = require("../utils/notifications");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeNotificationsDb(db);
  const list = db.notifications
    .filter((n) => n.userId === req.user.studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  const unread = list.filter((n) => !n.read).length;
  res.json({ notifications: list, unread });
});

router.patch("/read-all", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeNotificationsDb(db);
  db.notifications.forEach((n) => {
    if (n.userId === req.user.studentId) n.read = true;
  });
  writeDb(db);
  res.json({ ok: true });
});

router.patch("/:id/read", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeNotificationsDb(db);
  const n = db.notifications.find((x) => x.id === req.params.id && x.userId === req.user.studentId);
  if (!n) return res.status(404).json({ message: "Notification not found" });
  n.read = true;
  writeDb(db);
  res.json(n);
});

module.exports = router;
