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
  let list = items || [];
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

  const grid = document.getElementById("resource-grid");
  if (!grid) return;
  grid.innerHTML = filtered
    .map(
      (res) => `
    <article class="item-card product-card resource-card">
      <div class="item-image">📘<span class="product-badge">${escapeHtml(res.type || "Resource")}</span></div>
      <div class="item-content">
        <div class="product-cat">${escapeHtml(res.department || "General")} · Sem ${escapeHtml(String(res.sem || "-"))}</div>
        <div class="item-title">${escapeHtml(res.title || "Untitled")}</div>
        <div class="row" style="margin-top:10px;">
          ${res.fileUrl ? `<a class="btn" href="${res.fileUrl}" target="_blank" rel="noopener">Download File</a>` : `<span class="muted">No file attached</span>`}
        </div>
      </div>
    </article>
  `
    )
    .join("") || "<p class='muted'>No academic resources match your search.</p>";
}

async function loadResources(query) {
  try {
    const q = (query || "").trim();
    const path = q ? `/api/resources?q=${encodeURIComponent(q)}` : "/api/resources";
    allResources = (await api(path).catch(() => [])) || [];
    render(allResources);
  } catch (err) {
    console.error("Load resources error:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggle-upload");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const panel = document.getElementById("upload-panel");
      if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none";
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

  const form = document.getElementById("resource-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      const origText = submitBtn ? submitBtn.textContent : "Upload";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
      }
      try {
        const data = new FormData(event.target);
        await api("/api/resources", { method: "POST", body: data });
        event.target.reset();
        const panel = document.getElementById("upload-panel");
        if (panel) panel.style.display = "none";
        await loadResources(searchInput ? searchInput.value : "");
      } catch (err) {
        alert(err.message || "Upload failed. Please check your fields and file.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }
});
