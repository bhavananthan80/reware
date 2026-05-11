const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

function defaultDb() {
  return {
    students: [],
    marketplace: [],
    marketplaceRequests: [],
    lostFound: [],
    lostFoundRequests: [],
    resources: []
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
}

module.exports = {
  readDb,
  writeDb
};
