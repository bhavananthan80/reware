const crypto = require("crypto");

const CERTIFICATE_THRESHOLD = 1000;
const CHAMPION_MIN_POINTS = 500;
const KG_CO2_PER_REUSE = 2.4;

const POINT_VALUES = {
  MARKETPLACE_LIST: { points: 50, carbonKg: 0.5, reason: "Listed item on ReUse Marketplace" },
  MARKETPLACE_REQUEST: { points: 30, carbonKg: 0, reason: "Requested to buy a reused item" },
  MARKETPLACE_SOLD: { points: 120, carbonKg: KG_CO2_PER_REUSE, reason: "Completed a reuse sale" },
  MARKETPLACE_BOUGHT: { points: 100, carbonKg: KG_CO2_PER_REUSE, reason: "Bought a reused item" },
  LOST_REPORT: { points: 40, carbonKg: 0, reason: "Reported a lost item" },
  FOUND_REPORT: { points: 60, carbonKg: 0.3, reason: "Reported a found item" },
  LOSTFOUND_RESOLVED: { points: 150, carbonKg: 1.2, reason: "Lost & Found item recovered" },
  RESOURCE_UPLOAD: { points: 45, carbonKg: 0.2, reason: "Shared academic resource" },
  CHAT_ENGAGEMENT: { points: 5, carbonKg: 0, reason: "Campus chat engagement" }
};

function normalizePointsDb(db) {
  if (!db.certificates) db.certificates = [];
  if (!db.pointEvents) db.pointEvents = [];
  db.students.forEach((s) => {
    if (typeof s.sustainabilityPoints !== "number") s.sustainabilityPoints = 0;
    if (typeof s.carbonSavedKg !== "number") s.carbonSavedKg = 0;
  });
}

function getStudent(db, studentId) {
  return db.students.find((s) => s.id === studentId);
}

function awardPoints(db, studentId, eventKey, meta = {}) {
  normalizePointsDb(db);
  const cfg = POINT_VALUES[eventKey];
  if (!cfg) return null;

  const student = getStudent(db, studentId);
  if (!student) return null;

  const bonus = meta.bonusPoints || 0;
  const points = cfg.points + bonus;
  const carbonKg = cfg.carbonKg + (meta.extraCarbonKg || 0);

  student.sustainabilityPoints += points;
  student.carbonSavedKg = Math.round((student.carbonSavedKg + carbonKg) * 10) / 10;

  const event = {
    id: crypto.randomUUID(),
    studentId,
    eventKey,
    points,
    carbonKg,
    reason: meta.reason || cfg.reason,
    createdAt: new Date().toISOString()
  };
  db.pointEvents.push(event);

  const newCerts = checkCertificates(db, student);
  return { event, student, newCertificates: newCerts };
}

function issueCertificate(db, student, type, title) {
  const existing = db.certificates.find(
    (c) => c.studentId === student.id && c.type === type && !c.revoked
  );
  if (existing) return existing;

  const cert = {
    id: crypto.randomUUID(),
    studentId: student.id,
    studentName: student.name,
    department: student.department || "",
    type,
    title: title || "Campus Community Champion",
    totalPoints: student.sustainabilityPoints,
    carbonSavedKg: student.carbonSavedKg,
    issuedAt: new Date().toISOString()
  };
  db.certificates.push(cert);
  if (!student.certificateIds) student.certificateIds = [];
  student.certificateIds.push(cert.id);
  return cert;
}

function checkCertificates(db, student) {
  const issued = [];
  if (student.sustainabilityPoints >= CERTIFICATE_THRESHOLD) {
    const c = issueCertificate(db, student, "MILESTONE", "Sustainability Milestone Achiever");
    if (c) issued.push(c);
  }
  const board = getLeaderboard(db, 1);
  if (board[0] && board[0].id === student.id && board[0].sustainabilityPoints >= CHAMPION_MIN_POINTS) {
    const c = issueCertificate(db, student, "CHAMPION", "Campus Community Champion");
    if (c) issued.push(c);
  }
  return issued;
}

function getLeaderboard(db, limit = 20) {
  normalizePointsDb(db);
  return db.students
    .map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department,
      sustainabilityPoints: s.sustainabilityPoints || 0,
      carbonSavedKg: s.carbonSavedKg || 0,
      certificateIds: s.certificateIds || []
    }))
    .sort((a, b) => b.sustainabilityPoints - a.sustainabilityPoints)
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function getCertificate(db, certId) {
  normalizePointsDb(db);
  return db.certificates.find((c) => c.id === certId);
}

module.exports = {
  CERTIFICATE_THRESHOLD,
  POINT_VALUES,
  normalizePointsDb,
  awardPoints,
  getLeaderboard,
  getCertificate,
  checkCertificates,
  KG_CO2_PER_REUSE
};
