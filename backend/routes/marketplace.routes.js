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
  if (!db.marketplaceRequests) db.marketplaceRequests = [];
  db.marketplace.forEach((item) => {
    if (!item.status) item.status = "OPEN";
  });
}

function studentById(db, id) {
  return db.students.find((s) => s.id === id);
}

function itemById(db, itemId) {
  return db.marketplace.find((i) => i.id === itemId);
}

function enrichListingForViewer(db, item, viewerId) {
  const requests = db.marketplaceRequests;
  const mine = requests.filter((r) => r.itemId === item.id && r.buyerId === viewerId);
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
}

router.get("/meeting-places", authMiddleware, (_req, res) => {
  res.json(MEETING_PLACES);
});

router.get("/", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const viewerId = req.user.studentId;
  const listings = db.marketplace
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => enrichListingForViewer(db, item, viewerId));
  res.json(listings);
});

router.post("/", authMiddleware, upload.single("image"), (req, res) => {
  const { title, category, condition, price, description } = req.body;
  if (!title || !category || !condition || !price) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const db = readDb();
  normalizeDb(db);
  const item = {
    id: crypto.randomUUID(),
    title,
    category,
    condition,
    price,
    description: description || "",
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    ownerId: req.user.studentId,
    status: "OPEN",
    createdAt: new Date().toISOString()
  };
  db.marketplace.push(item);
  writeDb(db);
  return res.status(201).json(enrichListingForViewer(db, item, req.user.studentId));
});

router.get("/requests/incoming", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const sellerId = req.user.studentId;
  const list = db.marketplaceRequests
    .filter((r) => r.sellerId === sellerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const item = itemById(db, r.itemId);
      const buyer = studentById(db, r.buyerId);
      return {
        ...r,
        buyerName: buyer ? buyer.name : "Unknown",
        buyerEmail: buyer ? buyer.email : "",
        itemTitle: item ? item.title : "(removed)",
        itemPrice: item ? item.price : null
      };
    });
  res.json(list);
});

router.get("/requests/outgoing", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const buyerId = req.user.studentId;
  const list = db.marketplaceRequests
    .filter((r) => r.buyerId === buyerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const item = itemById(db, r.itemId);
      const seller = studentById(db, r.sellerId);
      return {
        ...r,
        sellerName: seller ? seller.name : "Unknown",
        itemTitle: item ? item.title : "(removed)",
        itemPrice: item ? item.price : null
      };
    });
  res.json(list);
});

router.patch("/requests/:requestId/accept", authMiddleware, (req, res) => {
  const { meetingPlace, meetingTime } = req.body;
  if (!isValidMeetingPlace(meetingPlace)) {
    return res.status(400).json({ message: "Invalid or missing meeting place", allowed: MEETING_PLACES });
  }
  const timeStr = typeof meetingTime === "string" ? meetingTime.trim() : "";
  if (!timeStr) {
    return res.status(400).json({ message: "Meeting time is required (set by seller)" });
  }

  const db = readDb();
  normalizeDb(db);
  const idx = db.marketplaceRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.marketplaceRequests[idx];
  if (request.sellerId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the seller can accept" });
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
  request.meetingTime = timeStr;
  request.updatedAt = now;

  db.marketplaceRequests.forEach((r) => {
    if (r.itemId === request.itemId && r.id !== request.id && r.status === "PENDING") {
      r.status = "REJECTED";
      r.updatedAt = now;
    }
  });

  const itemIndex = db.marketplace.findIndex((i) => i.id === request.itemId);
  if (itemIndex !== -1) {
    db.marketplace[itemIndex].status = "SOLD";
    db.marketplace[itemIndex].acceptedRequestId = request.id;
  }

  writeDb(db);
  res.json(request);
});

router.patch("/requests/:requestId/reject", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeDb(db);
  const idx = db.marketplaceRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.marketplaceRequests[idx];
  if (request.sellerId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the seller can reject" });
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
  const idx = db.marketplaceRequests.findIndex((r) => r.id === req.params.requestId);
  if (idx === -1) return res.status(404).json({ message: "Request not found" });

  const request = db.marketplaceRequests[idx];
  if (request.buyerId !== req.user.studentId) {
    return res.status(403).json({ message: "Only the buyer can cancel" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Only pending requests can be cancelled" });
  }

  request.status = "CANCELLED";
  request.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json(request);
});

router.post("/:itemId/requests", authMiddleware, (req, res) => {
  const { message } = req.body || {};
  const db = readDb();
  normalizeDb(db);

  const item = itemById(db, req.params.itemId);
  if (!item) return res.status(404).json({ message: "Listing not found" });
  if (item.status !== "OPEN") {
    return res.status(400).json({ message: "This item is no longer available" });
  }

  const buyerId = req.user.studentId;
  if (item.ownerId === buyerId) {
    return res.status(400).json({ message: "You cannot request your own listing" });
  }

  const duplicate = db.marketplaceRequests.some(
    (r) => r.itemId === item.id && r.buyerId === buyerId && r.status === "PENDING"
  );
  if (duplicate) {
    return res.status(409).json({ message: "You already have a pending request for this item" });
  }

  const now = new Date().toISOString();
  const request = {
    id: crypto.randomUUID(),
    itemId: item.id,
    buyerId,
    sellerId: item.ownerId,
    status: "PENDING",
    message: typeof message === "string" ? message.slice(0, 500) : "",
    meetingPlace: null,
    meetingTime: null,
    createdAt: now,
    updatedAt: now
  };
  db.marketplaceRequests.push(request);
  writeDb(db);
  res.status(201).json(request);
});

module.exports = router;
