requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) logoutLink.addEventListener("click", logout);

  const [market, lostFound, resources, me] = await Promise.all([
    api("/api/marketplace"),
    api("/api/lostfound"),
    api("/api/resources"),
    api("/api/users/me")
  ]);
  setStudent(me);

  const metrics = [
    { icon: "💰", value: `₹${market.reduce((sum, m) => sum + Number(m.price || 0), 0)}`, label: "Money Saved This Semester" },
    { icon: "♻️", value: market.length, label: "Items Reused on Campus" },
    { icon: "🍃", value: `${(market.length * 1.2).toFixed(1)} kg`, label: "Estimated CO2 Reduction" },
    { icon: "📚", value: resources.length, label: "Resources Shared" }
  ];
  document.getElementById("metrics").innerHTML = metrics.map((m) => `<div class="card metric-card"><div>${m.icon}</div><div class="metric-value">${m.value}</div><div class="muted">${m.label}</div><div class="metric-note">Growing this week</div></div>`).join("");

  const recent = [...market.map((i) => `Item listed: ${i.title}`), ...lostFound.map((i) => `${i.type.toUpperCase()}: ${i.itemName}`), ...resources.map((i) => `Resource uploaded: ${i.title}`)].slice(0, 6);
  document.getElementById("recent-activity").innerHTML = recent.map((r) => `<div class="list-item"><span>${r}</span></div>`).join("") || "<p class='muted'>No recent activity yet.</p>";

  const foundCount = lostFound.filter((x) => x.type === "found").length;
  document.getElementById("impact").innerHTML = `<h2>${Math.min(100, 40 + market.length * 5)}% eco goal</h2><p class="muted">Saved by buying second-hand</p><h3>₹${market.reduce((sum, m) => sum + Number(m.price || 0), 0)}</h3><p class="muted">${foundCount} found items listed</p>`;
});
