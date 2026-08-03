requireAuth();

let allItems = [];
let currentUser = null;
let meetingPlaces = [];
let requestItemId = null;
let acceptRequestId = null;
let currentFilter = "all";

let searchQuery = "";

function getFilteredItems() {
  let list = allItems;
  if (currentFilter !== "all") {
    list = list.filter((i) => i.category.toLowerCase().includes(currentFilter.toLowerCase()));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
    );
  }
  return list;
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "accepted") return "accepted";
  return "rejected";
}

function renderGrid(items) {
  const grid = document.getElementById("market-grid");
  if (!currentUser) {
    grid.innerHTML = "<p class='muted'>Loading...</p>";
    return;
  }
  grid.innerHTML = items.map((item) => {
    const isOwner = item.ownerId === currentUser.id;
    const sold = item.status === "SOLD";
    const mr = item.myRequest;
    let actionHtml = "";
    if (isOwner) {
      actionHtml = "<span class='badge'>Your listing</span>";
    } else if (sold) {
      actionHtml = "<span class='badge' style='background:#f0f0f0;color:#666;'>Sold</span>";
    } else if (mr && mr.status === "PENDING") {
      actionHtml = "<span class='badge' style='background:#fff4e0;color:#8a5a00;'>Request sent</span>";
    } else if (mr && mr.status === "ACCEPTED") {
      actionHtml = `<div><span class='badge' style='background:#e6f0e5;'>Accepted</span><div class='meet-highlight'>Meet: ${mr.meetingPlace || "—"} at ${mr.meetingTime || "—"}</div><a class='btn small' href='/chat.html?module=marketplace' data-nav style='margin-top:6px;display:inline-block;'>Open Chat</a></div>`;
    } else if (mr && (mr.status === "REJECTED" || mr.status === "CANCELLED")) {
      actionHtml = `<button type='button' class='btn' data-action='request' data-item-id='${item.id}'>Request again</button>`;
    } else {
      actionHtml = `<button type='button' class='btn' data-action='request' data-item-id='${item.id}'>Request to buy</button>`;
    }
    return `
    <article class="item-card product-card">
      <div class="item-image">${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover;" alt="" />` : "📦"}</div>
      <div class="item-content">
        <div class="row"><div class="item-title">${escapeHtml(item.title)}</div><span class="badge">${escapeHtml(item.condition)}</span></div>
        <div class="item-meta">${escapeHtml(item.category)}</div>
        <div class="row"><strong>₹${escapeHtml(String(item.price))}</strong>${actionHtml}</div>
      </div>
    </article>
  `;
  }).join("") || "<p class='muted'>No items listed yet.</p>";

  const countEl = document.getElementById("item-count");
  if (countEl) countEl.textContent = `Showing ${items.length} open items on your campus`;

  grid.querySelectorAll("[data-action='request']").forEach((btn) => {
    btn.addEventListener("click", () => openRequestModal(btn.dataset.itemId));
  });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function renderIncoming(list) {
  const el = document.getElementById("incoming-requests");
  const pending = list.filter((r) => r.status === "PENDING");
  if (!pending.length) {
    el.innerHTML = "<p class='muted'>No pending incoming requests.</p>";
    return;
  }
  el.innerHTML = pending.map((r) => `
    <div class="list-item request-row">
      <div>
        <strong>${escapeHtml(r.itemTitle)}</strong>
        <div class="muted" style="font-size:13px;">From ${escapeHtml(r.buyerName)} · ${escapeHtml(r.buyerPhone || "No phone")} · ₹${escapeHtml(String(r.itemPrice ?? ""))}</div>
        ${r.message ? `<div style="margin-top:6px;font-size:13px;">"${escapeHtml(r.message)}"</div>` : ""}
      </div>
      <div class="request-actions">
        <button type="button" class="btn small" data-action="accept-open" data-request-id="${r.id}">Accept</button>
        <button type="button" class="btn secondary small" data-action="reject" data-request-id="${r.id}">Reject</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-action='accept-open']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.requestId;
      const req = pending.find((x) => x.id === id);
      if (req) openAcceptModal(req.id, req.buyerName, req.itemTitle);
    });
  });
  el.querySelectorAll("[data-action='reject']").forEach((btn) => {
    btn.addEventListener("click", () => rejectRequest(btn.dataset.requestId));
  });
}

function renderOutgoing(list) {
  const el = document.getElementById("outgoing-requests");
  if (!list.length) {
    el.innerHTML = "<p class='muted'>You have not sent any requests yet.</p>";
    return;
  }
  el.innerHTML = list.map((r) => `
    <div class="list-item request-row">
      <div>
        <span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
        <strong style="margin-left:8px;">${escapeHtml(r.itemTitle)}</strong>
        <div class="muted" style="font-size:13px;">Seller: ${escapeHtml(r.sellerName)} · ${escapeHtml(r.sellerPhone || "No phone")} · ₹${escapeHtml(String(r.itemPrice ?? ""))}</div>
        ${r.status === "ACCEPTED" && r.meetingPlace ? `<div class="meet-highlight">Meet at: ${escapeHtml(r.meetingPlace)} at ${escapeHtml(r.meetingTime || "—")}</div>` : ""}
      </div>
      <div class="request-actions">
        ${r.status === "ACCEPTED" ? `<a class="btn small" href="/chat.html?module=marketplace&chat=${r.chatId || ""}" data-nav>Open Chat</a>` : ""}
        ${r.status === "PENDING" ? `<button type="button" class="btn secondary small" data-action="cancel-out" data-request-id="${r.id}">Cancel</button>` : ""}
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-action='cancel-out']").forEach((btn) => {
    btn.addEventListener("click", () => cancelOutgoing(btn.dataset.requestId));
  });
}

function fillMeetingSelect() {
  const sel = document.getElementById("accept-meeting-place");
  sel.innerHTML = meetingPlaces.map((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    return opt.outerHTML;
  }).join("");
}

function openRequestModal(itemId) {
  const item = allItems.find((i) => i.id === itemId);
  requestItemId = itemId;
  document.getElementById("request-item-title").textContent = item ? item.title : "";
  document.getElementById("request-message").value = "";
  document.getElementById("request-modal-error").textContent = "";
  document.getElementById("request-modal").style.display = "flex";
}

function closeRequestModal() {
  requestItemId = null;
  document.getElementById("request-modal").style.display = "none";
}

function openAcceptModal(requestId, buyerName, itemTitle) {
  acceptRequestId = requestId;
  document.getElementById("accept-buyer-line").textContent = `${buyerName} · ${itemTitle}`;
  document.getElementById("accept-modal-error").textContent = "";
  document.getElementById("accept-meeting-time").value = "";
  fillMeetingSelect();
  document.getElementById("accept-modal").style.display = "flex";
}

function closeAcceptModal() {
  acceptRequestId = null;
  document.getElementById("accept-modal").style.display = "none";
}

async function refreshLists() {
  const [items, incoming, outgoing] = await Promise.all([
    api("/api/marketplace"),
    api("/api/marketplace/requests/incoming"),
    api("/api/marketplace/requests/outgoing")
  ]);
  allItems = items;
  renderGrid(getFilteredItems());
  renderIncoming(incoming);
  renderOutgoing(outgoing);
}

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logout-link");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  document.getElementById("toggle-upload").addEventListener("click", () => {
    const panel = document.getElementById("upload-panel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  currentUser = await api("/api/users/me");
  meetingPlaces = await api("/api/marketplace/meeting-places");
  await refreshLists();

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter.toLowerCase();
      renderGrid(getFilteredItems());
    });
  });

  const searchInput = document.getElementById("market-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      renderGrid(getFilteredItems());
    });
  }

  const marketForm = document.getElementById("market-form");
  if (marketForm) {
    marketForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = marketForm.querySelector("button[type='submit']");
      const origText = submitBtn ? submitBtn.textContent : "Upload Item";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
      }
      try {
        const form = event.target;
        const data = new FormData(form);
        await api("/api/marketplace", { method: "POST", body: data });
        form.reset();
        const panel = document.getElementById("upload-panel");
        if (panel) panel.style.display = "none";
        await refreshLists();
      } catch (err) {
        alert(err.message || "Failed to list item. Please check required fields.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }

  document.getElementById("request-cancel").addEventListener("click", closeRequestModal);
  document.getElementById("request-modal").addEventListener("click", (e) => {
    if (e.target.id === "request-modal") closeRequestModal();
  });
  document.getElementById("request-submit").addEventListener("click", async () => {
    const errEl = document.getElementById("request-modal-error");
    errEl.textContent = "";
    if (!requestItemId) return;
    try {
      const message = document.getElementById("request-message").value;
      await api(`/api/marketplace/${requestItemId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      closeRequestModal();
      await refreshLists();
    } catch (e) {
      errEl.textContent = e.message || "Failed";
    }
  });

  document.getElementById("accept-cancel").addEventListener("click", closeAcceptModal);
  document.getElementById("accept-modal").addEventListener("click", (e) => {
    if (e.target.id === "accept-modal") closeAcceptModal();
  });
  document.getElementById("accept-submit").addEventListener("click", async () => {
    const errEl = document.getElementById("accept-modal-error");
    errEl.textContent = "";
    if (!acceptRequestId) return;
    const meetingPlace = document.getElementById("accept-meeting-place").value;
    const meetingTime = document.getElementById("accept-meeting-time").value;
    if (!meetingTime) { 
      errEl.textContent = "Meeting time is required."; 
      return; 
    }
    try {
      const accepted = await api(`/api/marketplace/requests/${acceptRequestId}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingPlace, meetingTime })
      });
      closeAcceptModal();
      if (accepted.chatId) {
        window.location.href = `/chat.html?module=marketplace&chat=${accepted.chatId}`;
        return;
      }
      await refreshLists();
    } catch (e) {
      errEl.textContent = e.message || "Failed";
    }
  });
});

async function rejectRequest(requestId) {
  if (!confirm("Reject this request?")) return;
  await api(`/api/marketplace/requests/${requestId}/reject`, { method: "PATCH" });
  await refreshLists();
}

async function cancelOutgoing(requestId) {
  if (!confirm("Cancel this request?")) return;
  await api(`/api/marketplace/requests/${requestId}/cancel`, { method: "PATCH" });
  await refreshLists();
}
