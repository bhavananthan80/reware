function requireAuth() {
  if (!localStorage.getItem("rewareToken")) {
    window.location.href = "/index.html";
  }
}

function logout() {
  localStorage.removeItem("rewareToken");
  localStorage.removeItem("rewareStudent");
  window.location.href = "/index.html";
}

function getStudent() {
  const raw = localStorage.getItem("rewareStudent");
  return raw ? JSON.parse(raw) : null;
}

function setStudent(student) {
  localStorage.setItem("rewareStudent", JSON.stringify(student));
}
