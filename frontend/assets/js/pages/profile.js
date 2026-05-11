requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("logout-link").addEventListener("click", logout);
  const me = await api("/api/users/me");
  setStudent(me);

  ["email", "regNo", "name", "department", "year", "sem"].forEach((field) => {
    const input = document.getElementById(field);
    if (input) input.value = me[field] || "";
  });

  document.getElementById("profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: document.getElementById("name").value,
      department: document.getElementById("department").value,
      year: document.getElementById("year").value,
      sem: document.getElementById("sem").value
    };
    const updated = await api("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStudent(updated);
    document.getElementById("profile-msg").textContent = "Profile updated successfully.";
  });
});
