const fs = require("fs");
const path = require("path");
const { db } = require("../config/firebase");
const { doc, setDoc } = require("firebase/firestore");

const dbPath = path.join(__dirname, "../data/db.json");

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

function ensureDataDir() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDb() {
  ensureDataDir();
  if (!fs.existsSync(dbPath)) {
    const initial = defaultDb();
    writeDb(initial);
    return initial;
  }
  const raw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data) {
  ensureDataDir();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

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
