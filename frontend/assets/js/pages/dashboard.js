requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  const [market, lostFound, resources, me, points] = await Promise.all([
    api("/api/marketplace"),
    api("/api/lostfound"),
    api("/api/resources"),
    api("/api/users/me"),
    api("/api/points/me").catch(() => ({ sustainabilityPoints: 0, carbonSavedKg: 0, rank: null }))
  ]);
  setStudent(me);

  const metrics = [
    { icon: "🍃", value: points.sustainabilityPoints, label: "Sustainability Points" },
    { icon: "♻️", value: `${points.carbonSavedKg} kg`, label: "Estimated CO₂ Avoided" },
    { icon: "🛒", value: market.length, label: "Open Marketplace Items" },
    { icon: "📚", value: resources.length, label: "Academic Resources" }
  ];
  document.getElementById("metrics").innerHTML = metrics
    .map(
      (m) =>
        `<div class="card metric-card"><div>${m.icon}</div><div class="metric-value">${m.value}</div><div class="muted">${m.label}</div><div class="metric-note"><a data-nav href="/leaderboard.html">View leaderboard →</a></div></div>`
    )
    .join("");

  const recent = [
    ...market.map((i) => `Item listed: ${i.title}`),
    ...lostFound.map((i) => `${i.type.toUpperCase()}: ${i.itemName}`),
    ...resources.map((i) => `Resource uploaded: ${i.title}`),
    ...(points.recentEvents || []).map((e) => `+${e.points} pts: ${e.reason}`)
  ].slice(0, 8);
  document.getElementById("recent-activity").innerHTML =
    recent.map((r) => `<div class="list-item"><span>${r}</span></div>`).join("") ||
    "<p class='muted'>No recent activity yet.</p>";

  const foundCount = lostFound.filter((x) => x.type === "found").length;
  document.getElementById("impact").innerHTML = `
    <h2>Rank #${points.rank || "—"}</h2>
    <p class="muted">${points.sustainabilityPoints} sustainability points</p>
    <h3>${points.carbonSavedKg} kg CO₂</h3>
    <p class="muted">${foundCount} open found reports · ${market.length} reuse listings</p>
    ${points.certificates?.length ? `<a class="btn" data-nav href="/certificate.html?id=${points.certificates[0].id}" style="margin-top:8px;display:inline-block;">View certificate</a>` : ""}
  `;
});
