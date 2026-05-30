requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  const me = await api("/api/users/me");
  setStudent(me);

  const initials = (me.name || "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hero = document.getElementById("profile-hero");
  if (hero) {
    hero.innerHTML = `
      <div class="profile-avatar">${initials}</div>
      <div>
        <h2 style="margin:0;">${me.name || "Student"}</h2>
        <p class="muted" style="margin:4px 0 0;">${me.department || ""} · Year ${me.year || ""} · Sem ${me.sem || ""}</p>
        <p class="muted" style="margin:4px 0 0;font-size:13px;">${me.email || ""}</p>
      </div>
    `;
  }

  ["email", "regNo", "phone", "name", "department", "year", "sem"].forEach((field) => {
    const input = document.getElementById(field);
    if (input) input.value = me[field] || "";
  });

  document.getElementById("profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
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
