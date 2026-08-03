requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [market, lostFound, resources, me, points] = await Promise.all([
      api("/api/marketplace").catch(() => []),
      api("/api/lostfound").catch(() => []),
      api("/api/resources").catch(() => []),
      api("/api/users/me").catch(() => null),
      api("/api/points/me").catch(() => ({ sustainabilityPoints: 0, carbonSavedKg: 0, rank: null }))
    ]);
    if (me) setStudent(me);

    const metrics = [
      { icon: "🍃", value: points.sustainabilityPoints || 0, label: "Sustainability Points" },
      { icon: "♻️", value: `${points.carbonSavedKg || 0} kg`, label: "Estimated CO₂ Avoided" },
      { icon: "🛒", value: (market || []).length, label: "Open Marketplace Items" },
      { icon: "📚", value: (resources || []).length, label: "Academic Resources" }
    ];
    const metricsEl = document.getElementById("metrics");
    if (metricsEl) {
      metricsEl.innerHTML = metrics
        .map(
          (m) =>
            `<div class="card metric-card"><div>${m.icon}</div><div class="metric-value">${m.value}</div><div class="muted">${m.label}</div><div class="metric-note"><a data-nav href="/leaderboard.html">View leaderboard →</a></div></div>`
        )
        .join("");
    }

    const recent = [
      ...(market || []).map((i) => `Item listed: ${i.title}`),
      ...(lostFound || []).map((i) => `${(i.type || "").toUpperCase()}: ${i.itemName}`),
      ...(resources || []).map((i) => `Resource uploaded: ${i.title}`),
      ...(points.recentEvents || []).map((e) => `+${e.points} pts: ${e.reason}`)
    ].slice(0, 8);
    const recentEl = document.getElementById("recent-activity");
    if (recentEl) {
      recentEl.innerHTML =
        recent.map((r) => `<div class="list-item"><span>${r}</span></div>`).join("") ||
        "<p class='muted'>No recent activity yet.</p>";
    }

    const foundCount = (lostFound || []).filter((x) => x.type === "found").length;
    const impactEl = document.getElementById("impact");
    if (impactEl) {
      impactEl.innerHTML = `
        <h2>Rank #${points.rank || "—"}</h2>
        <p class="muted">${points.sustainabilityPoints || 0} sustainability points</p>
        <h3>${points.carbonSavedKg || 0} kg CO₂</h3>
        <p class="muted">${foundCount} open found reports · ${(market || []).length} reuse listings</p>
        ${points.certificates?.length ? `<a class="btn" data-nav href="/certificate.html?id=${points.certificates[0].id}" style="margin-top:8px;display:inline-block;">View certificate</a>` : ""}
      `;
    }
  } catch (err) {
    console.error("Dashboard error:", err);
  }
});
