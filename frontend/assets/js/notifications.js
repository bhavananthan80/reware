async function loadNotificationsUi() {
  const btn = document.getElementById("notif-btn");
  const dropdown = document.getElementById("notif-dropdown");
  const badge = document.getElementById("notif-badge");
  if (!btn || !dropdown || !localStorage.getItem("rewareToken")) return;

  async function refresh() {
    try {
      const { notifications, unread } = await api("/api/notifications");
      if (unread > 0) {
        badge.style.display = "grid";
        badge.textContent = unread > 9 ? "9+" : String(unread);
      } else {
        badge.style.display = "none";
      }
      dropdown.innerHTML =
        notifications.length === 0
          ? `<div class="notif-item muted">No notifications yet.</div>`
          : notifications
              .map(
                (n) => `
          <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" data-link="${n.link || ""}">
            <strong>${escapeNotif(n.title)}</strong><br/>
            <span class="muted">${escapeNotif(n.message)}</span>
          </div>`
              )
              .join("");
      dropdown.querySelectorAll(".notif-item[data-id]").forEach((el) => {
        el.addEventListener("click", async () => {
          await api(`/api/notifications/${el.dataset.id}/read`, { method: "PATCH" });
          dropdown.classList.remove("open");
          if (el.dataset.link) window.location.href = el.dataset.link;
          else refresh();
        });
      });
    } catch {
      dropdown.innerHTML = `<div class="notif-item">Could not load notifications.</div>`;
    }
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    if (dropdown.classList.contains("open")) refresh();
  });
  document.addEventListener("click", () => dropdown.classList.remove("open"));
  dropdown.addEventListener("click", (e) => e.stopPropagation());
  refresh();
  setInterval(refresh, 30000);
}

function escapeNotif(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
