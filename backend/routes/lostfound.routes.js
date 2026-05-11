const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");
const { MEETING_PLACES, isValidMeetingPlace } = require("../utils/meetingPlaces");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

function normalizeDb(db) {
  if (!db.lostFoundRequests) db.lostFoundRequests = [];
  db.lostFound.forEach((item) => {
    if (!item.status) item.status = "OPEN";
  });
}

function studentById(db, id) {
  return db.students.find((s) => s.id === id);
}

function itemById(db, itemId) {
  return db.lostFound.find((i) => i.id === itemId);
}

router.get("/", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const viewerId = req.user.studentId;
  const listings = db.lostFound
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => {
      const requests = db.lostFoundRequests;
      const mine = requests.filter((r) => r.itemId === item.id && r.requesterId === viewerId);
      const latestMine = mine.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      let myRequest = null;
      if (latestMine) {
        myRequest = {
          status: latestMine.status,
          meetingPlace: latestMine.meetingPlace || null,
          meetingTime: latestMine.meetingTime || null,
          requestId: latestMine.id
        };
      }
      return {
        ...item,
        status: item.status || "OPEN",
        myRequest
      };
    });
  res.json(listings);
});

function createEntry(req, res, type) {
  const { itemName, location, time } = req.body;
  if (!itemName || !location) {
    return res.status(400).json({ message: "itemName and location are required" });
  }

  const db = readDb();
  normalizeDb(db);
  const entry = {
    id: crypto.randomUUID(),
    type,
    itemName,
    location,
    time: time || "",
    status: "OPEN",
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    studentId: req.user.studentId,
    createdAt: new Date().toISOString()
  };
  db.lostFound.push(entry);
  writeDb(db);
  return res.status(201).json(entry);
}

router.post("/lost", authMiddleware, upload.single("image"), (req, res) => createEntry(req, res, "lost"));
router.post("/found", authMiddleware, upload.single("image"), (req, res) => createEntry(req, res, "found"));

// LOST & FOUND REQUESTS INC

router.post("/:itemId/requests", authMiddleware, (req, res) => {
  const { message, meetingPlace, meetingTime } = req.body || {};
  const db = readDb();
  normalizeDb(db);

  if (!isValidMeetingPlace(meetingPlace)) {
    return res.status(400).json({ message: "Invalid or missing meeting place", allowed: MEETING_PLACES });
  }
  const proposedTime = typeof meetingTime === "string" ? meetingTime.trim() : "";
  if (!proposedTime) {
    return res.status(400).json({ message: "meetingTime is required" });
  }

  const item = itemById(db, req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });
  if (item.status !== "OPEN") {
    return res.status(400).json({ message: "This item is no longer open" });
  }

  const requesterId = req.user.studentId;
  const targetId = item.studentId;
  
  if (targetId === requesterId) {
    return res.status(400).json({ message: "You cannot request your own item" });
  }

  const duplicate = db.lostFoundRequests.some(
    (r) => r.itemId === item.id && r.requesterId === requesterId && r.status === "PENDING"
  );
  if (duplicate) {
    return res.status(409).json({ message: "You already have a pending request for this item" });
  }

  const now = new Date().toISOString();
  const request = {
    id: crypto.randomUUID(),
    itemId: item.id,
    requesterId,
    targetId,
    status: "PENDING",
    message: typeof message === "string" ? message.slice(0, 500) : "",
    meetingPlace,
    meetingTime,
    createdAt: now,
    updatedAt: now
  };
  db.lostFoundRequests.push(request);
  writeDb(db);
  res.status(201).json(request);
});

router.get("/requests/incoming", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const targetId = req.user.studentId;
  const list = db.lostFoundRequests
    .filter((r) => r.targetId === targetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const item = itemById(db, r.itemId);
      const requester = studentById(db, r.requesterId);
      return {
        ...r,
        requesterName: requester ? requester.name : "Unknown",
        itemTitle: item ? item.itemName : "(removed)"
      };
    });
  res.json(list);
});

router.get("/requests/outgoing", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const requesterId = req.user.studentId;
  const list = db.lostFoundRequests
    .filter((r) => r.requesterId === requesterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const item = itemById(db, r.itemId);
      const targetUser = studentById(db, r.targetId);
      return {
        ...r,
        targetName: targetUser ? targetUser.name : "Unknown",
        itemTitle: item ? item.itemName : "(removed)"
      };
    });
  res.json(list);
});

router.patch("/requests/:requestId/accept", authMiddleware, (req, res) => {
  const { meetingPlace, meetingTime } = req.body || {};
  if (!isValidMeetingPlace(meetingPlace)) {
    return res.status(400).json({ message: "Invalid or missing meeting place", allowed: MEETING_PLACES });
  }
  const finalTime = typeof meetingTime === "string" ? meetingTime.trim() : "";
  if (!finalTime) {
    return res.status(400).json({ message: "Meeting time is required (seller sets the final time)" });
  }

  const db = readDb();
  normalizeDb(db);
  const idx = db.lostFoundRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.lostFoundRequests[idx];
  if (request.targetId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the owner can accept" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Request is not pending" });
  }

  const item = itemById(db, request.itemId);
  if (!item || item.status !== "OPEN") {
    return res.status(400).json({ message: "Item is no longer available" });
  }

  const now = new Date().toISOString();
  request.status = "ACCEPTED";
  request.meetingPlace = meetingPlace;
  request.meetingTime = finalTime;
  request.updatedAt = now;

  db.lostFoundRequests.forEach((r) => {
    if (r.itemId === request.itemId && r.id !== request.id && r.status === "PENDING") {
      r.status = "REJECTED";
      r.updatedAt = now;
    }
  });

  const itemIndex = db.lostFound.findIndex((i) => i.id === request.itemId);
  if (itemIndex !== -1) {
    db.lostFound[itemIndex].status = "RESOLVED";
    db.lostFound[itemIndex].acceptedRequestId = request.id;
  }

  writeDb(db);
  res.json(request);
});

router.patch("/requests/:requestId/reject", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const idx = db.lostFoundRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.lostFoundRequests[idx];
  if (request.targetId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the owner can reject" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Request is not pending" });
  }

  request.status = "REJECTED";
  request.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json(request);
});

router.patch("/requests/:requestId/cancel", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const idx = db.lostFoundRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.lostFoundRequests[idx];
  if (request.requesterId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the requester can cancel" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Only pending requests can be cancelled" });
  }

  request.status = "CANCELLED";
  request.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json(request);
});

module.exports = router;
