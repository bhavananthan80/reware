const fs = require("fs");
const path = require("path");
const os = require("os");
const { db } = require("../config/firebase");
const { doc, setDoc } = require("firebase/firestore");

const defaultDbPath = path.join(__dirname, "../data/db.json");
const tmpDbPath = path.join(os.tmpdir(), "reware_db.json");

let memoryDb = null;

function defaultDb() {
  return {
    students: [],
    marketplace: [],
    marketplaceRequests: [],
    lostFound: [],
    lostFoundRequests: [],
    resources: [],
    chats: [],
    chatMessages: [],
    notifications: [],
    pointEvents: [],
    certificates: []
  };
}

function ensureDataDir(filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_e) {
    // Ignore errors for read-only systems
  }
}

function readDb() {
  if (memoryDb) {
    return memoryDb;
  }

  // Try standard path first
  try {
    if (fs.existsSync(defaultDbPath)) {
      const raw = fs.readFileSync(defaultDbPath, "utf-8");
      memoryDb = JSON.parse(raw);
      return memoryDb;
    }
  } catch (_e) {}

  // Fallback to /tmp path for serverless environments (Vercel)
  try {
    if (fs.existsSync(tmpDbPath)) {
      const raw = fs.readFileSync(tmpDbPath, "utf-8");
      memoryDb = JSON.parse(raw);
      return memoryDb;
    }
  } catch (_e) {}

  // Initial default state
  memoryDb = defaultDb();
  writeDb(memoryDb);
  return memoryDb;
}

function writeDb(data) {
  memoryDb = data;

  // Try writing to /tmp first (guaranteed writable on Vercel/Serverless)
  try {
    ensureDataDir(tmpDbPath);
    fs.writeFileSync(tmpDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("[DB Warning] /tmp write skipped:", err.message);
  }

  // Also try writing to project data directory if writable (local dev)
  try {
    ensureDataDir(defaultDbPath);
    fs.writeFileSync(defaultDbPath, JSON.stringify(data, null, 2));
  } catch (_err) {
    // Read-only filesystem on Vercel serverless — expected
  }

  // Sync to Firebase Cloud Firestore asynchronously
  syncToFirebase(data).catch((err) => {
    console.warn("[Firebase Sync Notice]:", err.message || err);
  });
}

async function syncToFirebase(data) {
  try {
    const docRef = doc(db, "reware_app", "database");
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn("[Firebase] Data sync error:", err.message);
  }
}

module.exports = {
  readDb,
  writeDb,
  syncToFirebase
};
