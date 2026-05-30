requireAuth();

let searchTimer = null;
let typeFilter = "all";
let allResources = [];

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function filterResources(items) {
  let list = items;
  if (typeFilter !== "all") {
    list = list.filter((r) => {
      const t = (r.type || "").toLowerCase();
      if (typeFilter === "notes") return t.includes("note");
      if (typeFilter === "question") return t.includes("question");
      if (typeFilter === "guide") return t.includes("guide");
      return true;
    });
  }
  return list;
}

function render(items) {
  const filtered = filterResources(items);
  const countEl = document.getElementById("resource-count");
  if (countEl) countEl.textContent = `Showing ${filtered.length} resources on your campus`;

  document.getElementById("resource-grid").innerHTML = filtered
    .map(
      (res) => `
    <article class="item-card product-card resource-card">
      <div class="item-image">📘<span class="product-badge">${escapeHtml(res.type)}</span></div>
      <div class="item-content">
        <div class="product-cat">${escapeHtml(res.department)} · Sem ${escapeHtml(String(res.sem))}</div>
        <div class="item-title">${escapeHtml(res.title)}</div>
        <div class="row" style="margin-top:10px;">
          ${res.fileUrl ? `<a class="btn" href="${res.fileUrl}" target="_blank" rel="noopener">Download</a>` : `<span class="muted">No file</span>`}
        </div>
      </div>
    </article>
  `
    )
    .join("") || "<p class='muted'>No resources match your search.</p>";
}

async function loadResources(query) {
  const q = (query || "").trim();
  const path = q ? `/api/resources?q=${encodeURIComponent(q)}` : "/api/resources";
  allResources = await api(path);
  render(allResources);
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggle-upload");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const panel = document.getElementById("upload-panel");
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  }

  await loadResources();

  const searchInput = document.getElementById("resource-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadResources(searchInput.value), 300);
    });
  }

  document.querySelectorAll("[data-type-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-type-filter]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      typeFilter = chip.dataset.typeFilter;
      render(allResources);
    });
  });

  document.getElementById("resource-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    await api("/api/resources", { method: "POST", body: data });
    event.target.reset();
    document.getElementById("upload-panel").style.display = "none";
    await loadResources(searchInput ? searchInput.value : "");
  });
});

