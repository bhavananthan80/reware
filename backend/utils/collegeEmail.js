/**
 * Rajalakshmi Institute of Technology student emails use *.ritchennai.edu.in,
 * e.g. bhavananthan.250013@csbs.ritchennai.edu.in
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidCollegeEmail(email) {
  const e = normalizeEmail(email);
  if (!e.includes("@")) return false;
  if (!e.endsWith(".ritchennai.edu.in")) return false;

  const local = e.split("@")[0];
  if (!local || local.length < 3) return false;

  const domain = e.slice(e.indexOf("@") + 1);
  const parts = domain.split(".");
  if (parts.length < 4) return false;
  const lastThree = parts.slice(-3).join(".");
  if (lastThree !== "ritchennai.edu.in") return false;

  return parts[0].length > 0;
}

module.exports = {
  normalizeEmail,
  isValidCollegeEmail
};
