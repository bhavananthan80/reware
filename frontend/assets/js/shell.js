const NAV_ITEMS = [
  { page: "reware.html", href: "/reware.html", icon: "🛒", label: "Marketplace" },
  { page: "dashboard.html", href: "/dashboard.html", icon: "📊", label: "Dashboard" },
  { page: "academic-hub.html", href: "/academic-hub.html", icon: "📚", label: "Academic Hub" },
  { page: "leaderboard.html", href: "/leaderboard.html", icon: "🏆", label: "Leaderboard" },
  { page: "lost-found.html", href: "/lost-found.html", icon: "🔍", label: "Lost & Found" },
  { page: "chat.html", href: "/chat.html", icon: "💬", label: "Chat" }
];

function currentPage() {
  return location.pathname.split("/").pop() || "dashboard.html";
}

function renderAppShell() {
  const aside = document.querySelector(".app-layout .sidebar");
  if (!aside) return;

  const page = currentPage();
  aside.classList.add("cc-sidebar");

  const links = NAV_ITEMS.map(
    (n) =>
      `<a class="nav-link${n.page === page ? " active" : ""}" data-page="${n.page}" data-nav href="${n.href}"><span class="nav-icon">${n.icon}</span>${n.label}</a>`
  ).join("");

  aside.innerHTML = `
    <div class="brand-title">CampusCycle</div>
    <div class="brand-sub">Circular Economy</div>
    <div class="nav-group" style="margin-top:20px;">${links}</div>
    <div class="cc-sidebar-bottom">
      <a class="cc-claim-btn" data-nav href="/leaderboard.html">Claim Rewards</a>
      <a class="nav-link" data-page="profile.html" data-nav href="/profile.html"><span class="nav-icon">👤</span>My Profile</a>
      <a class="nav-link" href="#" id="logout-link"><span class="nav-icon">⎋</span>Logout</a>
    </div>
  `;

  const logout = document.getElementById("logout-link");
  if (logout && typeof window.logout === "function") {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      window.logout();
    });
  }

  injectTopbarExtras();
}

function injectTopbarExtras() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || topbar.querySelector(".topbar-actions")) return;

  const wrap = document.createElement("div");
  wrap.className = "topbar-actions";
  wrap.innerHTML = `
    <a href="/leaderboard.html" class="points-pill" id="points-pill" data-nav>🍃 … pts</a>
    <div class="notif-wrap">
      <button type="button" class="notif-btn" id="notif-btn" aria-label="Notifications">🔔<span class="notif-badge" id="notif-badge" style="display:none;">0</span></button>
      <div class="notif-dropdown" id="notif-dropdown"></div>
    </div>
  `;
  topbar.appendChild(wrap);

  if (typeof loadNotificationsUi === "function") loadNotificationsUi();
  if (typeof loadPointsPill === "function") loadPointsPill();
}

async function loadPointsPill() {
  const el = document.getElementById("points-pill");
  if (!el || !localStorage.getItem("rewareToken")) return;
  try {
    const data = await api("/api/points/me");
    el.textContent = `🍃 ${data.sustainabilityPoints} pts · ${data.carbonSavedKg} kg CO₂`;
  } catch {
    el.textContent = "🍃 Eco Points";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAppShell();
  if (typeof markActiveNav === "function") markActiveNav();
  if (typeof injectHeaderBrand === "function") injectHeaderBrand();
});
