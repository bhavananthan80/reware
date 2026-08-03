requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await api("/api/users/me");
    if (me) setStudent(me);

    const initials = ((me && me.name) || "Student")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const hero = document.getElementById("profile-hero");
    if (hero && me) {
      hero.innerHTML = `
        <div class="profile-avatar">${me.avatarUrl ? `<img src="${me.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" />` : initials}</div>
        <div>
          <h2 style="margin:0;">${me.name || "Student"}</h2>
          <p class="muted" style="margin:4px 0 0;">${me.department || ""} · Year ${me.year || ""} · Sem ${me.sem || ""}</p>
          <p class="muted" style="margin:4px 0 0;font-size:13px;">${me.email || ""}</p>
        </div>
      `;
    }

    if (me) {
      ["email", "regNo", "phone", "name", "department", "year", "sem"].forEach((field) => {
        const input = document.getElementById(field);
        if (input) input.value = me[field] || "";
      });
    }

    const form = document.getElementById("profile-form");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const msgEl = document.getElementById("profile-msg");
        if (msgEl) {
          msgEl.style.color = "#4f46e5";
          msgEl.textContent = "Saving changes...";
        }
        try {
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
          if (msgEl) {
            msgEl.style.color = "#047857";
            msgEl.textContent = "✓ Profile updated successfully!";
          }
        } catch (err) {
          if (msgEl) {
            msgEl.style.color = "#dc2626";
            msgEl.textContent = err.message || "Failed to update profile.";
          }
        }
      });
    }
  } catch (err) {
    console.error("Profile page load error:", err);
  }
});
