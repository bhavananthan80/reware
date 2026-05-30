requireAuth();

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

document.addEventListener("DOMContentLoaded", async () => {
  const [board, me] = await Promise.all([
    api("/api/points/leaderboard"),
    api("/api/points/me")
  ]);

  const ptsToCert = Math.max(0, me.certificateThreshold - me.sustainabilityPoints);
  const certLinks = me.certificates.length
    ? me.certificates.map((c) => `<a class="btn" data-nav href="/certificate.html?id=${c.id}">View certificate</a>`).join(" ")
    : `<span class="muted">${ptsToCert} pts until auto-certificate</span>`;

  document.getElementById("my-stats").innerHTML = `
    <div class="row" style="flex-wrap:wrap;gap:16px;">
      <div><div class="metric-value" style="font-size:32px;">${me.sustainabilityPoints}</div><div class="muted">Your points</div></div>
      <div><div class="metric-value" style="font-size:32px;">${me.carbonSavedKg} kg</div><div class="muted">CO₂ avoided (est.)</div></div>
      <div><div class="metric-value" style="font-size:32px;">#${me.rank || "—"}</div><div class="muted">Campus rank</div></div>
      <div>${certLinks}</div>
    </div>
  `;

  const student = JSON.parse(localStorage.getItem("rewareStudent") || "{}");
  const rows = board.leaderboard
    .map(
      (r) => `
    <tr class="${r.id === student.id ? "highlight" : ""}">
      <td class="rank-medal">${medal(r.rank)}</td>
      <td>${r.name}</td>
      <td>${r.department || "—"}</td>
      <td><strong>${r.sustainabilityPoints}</strong></td>
      <td>${r.carbonSavedKg} kg</td>
    </tr>
  `
    )
    .join("");

  document.getElementById("leaderboard-table").innerHTML = `
    <table class="leaderboard-table">
      <thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Points</th><th>CO₂ saved</th></tr></thead>
      <tbody>${rows || "<tr><td colspan='5'>No rankings yet.</td></tr>"}</tbody>
    </table>
  `;
});
