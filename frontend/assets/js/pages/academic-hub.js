requireAuth();

function render(items) {
  document.getElementById("resource-grid").innerHTML = items.map((res) => `
    <article class="item-card">
      <div class="item-image">📘</div>
      <div class="item-content">
        <div class="item-title">${res.title}</div>
        <div class="item-meta">${res.type} | ${res.department} | Sem ${res.sem}</div>
        <div class="row"><span class="badge">${res.type}</span>${res.fileUrl ? `<a class="btn secondary" href="${res.fileUrl}" target="_blank">Download</a>` : ""}</div>
      </div>
    </article>
  `).join("") || "<p class='muted'>No resources uploaded yet.</p>";
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("logout-link").addEventListener("click", logout);
  render(await api("/api/resources"));

  document.getElementById("resource-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    await api("/api/resources", { method: "POST", body: data });
    event.target.reset();
    render(await api("/api/resources"));
  });
});
