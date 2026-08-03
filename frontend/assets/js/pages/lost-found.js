requireAuth();

let allItems = [];
let currentUser = null;
let meetingPlaces = [];
let requestItemId = null;
let acceptLfRequestId = null;
let lfFilter = "all";
let lfSearch = "";

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "accepted") return "accepted";
  return "rejected";
}

function listTemplate(items) {
  if (!items.length) return "<p class='muted'>No reports yet.</p>";
  return items.map((entry) => {
    let actionBtn = "";
    const isOwner = entry.studentId === currentUser?.id;
    if (isOwner) {
      actionBtn = "<span class='badge' style='background:#f0f0f0;color:#666;'>Your post</span>";
    } else if (entry.status !== "OPEN") {
      actionBtn = `<span class='badge'>${entry.status}</span>`;
    } else {
      actionBtn = `<button class='btn small request-btn' data-id='${entry.id}'>Request / Claim</button>`;
    }

    const typeBadge = entry.type === "lost" ? "🔴 Lost" : "🟢 Found";
    return `<div class="lf-entry-card">
      <div>
        <span class="product-badge" style="position:static;display:inline-block;margin-bottom:6px;">${typeBadge}</span>
        <strong>${escapeHtml(entry.itemName || "")}</strong>
        <div class="muted" style="font-size:13px;">📍 ${escapeHtml(entry.location || "")} · ${escapeHtml(entry.time || "No time")}</div>
      </div>
      <div>${actionBtn}</div>
    </div>`;
  }).join("");
}

function fillAcceptLfSelect() {
  const sel = document.getElementById("accept-lf-meeting-place");
  if (!sel) return;
  sel.innerHTML = meetingPlaces.map((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    return opt.outerHTML;
  }).join("");
}

function openAcceptLfModal(req) {
  acceptLfRequestId = req.id;
  const summary = document.getElementById("accept-lf-summary");
  if (summary) summary.textContent = `${req.requesterName || "User"} · ${req.itemTitle || "Item"}`;
  const errEl = document.getElementById("accept-lf-modal-error");
  if (errEl) errEl.textContent = "";
  fillAcceptLfSelect();
  const placeSel = document.getElementById("accept-lf-meeting-place");
  const timeInput = document.getElementById("accept-lf-meeting-time");
  if (placeSel && req.meetingPlace && meetingPlaces.includes(req.meetingPlace)) {
    placeSel.value = req.meetingPlace;
  }
  if (timeInput) timeInput.value = req.meetingTime || "";
  const modal = document.getElementById("accept-lf-modal");
  if (modal) modal.style.display = "flex";
}

function closeAcceptLfModal() {
  acceptLfRequestId = null;
  const modal = document.getElementById("accept-lf-modal");
  if (modal) modal.style.display = "none";
}

function renderIncoming(list) {
  const el = document.getElementById("incoming-requests");
  if (!el) return;
  const pending = (list || []).filter((r) => r.status === "PENDING");
  if (!pending.length) {
    el.innerHTML = "<p class='muted'>No pending incoming requests.</p>";
    return;
  }
  el.innerHTML = pending.map((r) => `
    <div class="list-item request-row">
      <div>
        <strong>${escapeHtml(r.itemTitle)}</strong>
        <div class="muted" style="font-size:13px;">From ${escapeHtml(r.requesterName)} · ${escapeHtml(r.requesterPhone || "No phone")}</div>
        <div class="meet-highlight" style="margin-top:4px;">They proposed: ${escapeHtml(r.meetingPlace)} at ${escapeHtml(r.meetingTime)}</div>
        ${r.message ? `<div style="margin-top:6px;font-size:13px;">"${escapeHtml(r.message)}"</div>` : ""}
      </div>
      <div class="request-actions">
        <button type="button" class="btn small" data-action="accept-open" data-id="${r.id}">Accept</button>
        <button type="button" class="btn secondary small" data-action="reject" data-id="${r.id}">Reject</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-action='accept-open']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const req = pending.find((x) => x.id === btn.dataset.id);
      if (req) openAcceptLfModal(req);
    });
  });
  el.querySelectorAll("[data-action='reject']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Reject this request?")) return;
      await api(`/api/lostfound/requests/${btn.dataset.id}/reject`, { method: "PATCH" });
      await refresh();
    });
  });
}

function renderOutgoing(list) {
  const el = document.getElementById("outgoing-requests");
  if (!el) return;
  if (!(list || []).length) {
    el.innerHTML = "<p class='muted'>You have not sent any requests yet.</p>";
    return;
  }
  el.innerHTML = list.map((r) => {
    const meetLine =
      r.status === "ACCEPTED"
        ? `<div class="meet-highlight">Confirmed meet: ${escapeHtml(r.meetingPlace)} at ${escapeHtml(r.meetingTime)}</div>`
        : `<div class="meet-highlight">Your proposal: ${escapeHtml(r.meetingPlace)} at ${escapeHtml(r.meetingTime)}</div>`;
    return `
    <div class="list-item request-row">
      <div>
        <span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
        <strong style="margin-left:8px;">${escapeHtml(r.itemTitle)}</strong>
        <div class="muted" style="font-size:13px;">To: ${escapeHtml(r.targetName)} · ${escapeHtml(r.targetPhone || "No phone")}</div>
        ${meetLine}
      </div>
      <div class="request-actions">
        ${r.status === "ACCEPTED" ? `<a class="btn small" href="/chat.html?module=lostfound&chat=${r.chatId || ""}" data-nav>Open Chat</a>` : ""}
        ${r.status === "PENDING" ? `<button type="button" class="btn secondary small" data-action="cancel" data-id="${r.id}">Cancel</button>` : ""}
      </div>
    </div>
  `;
  }).join("");

  el.querySelectorAll("[data-action='cancel']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this request?")) return;
      await api(`/api/lostfound/requests/${btn.dataset.id}/cancel`, { method: "PATCH" });
      await refresh();
    });
  });
}

function fillMeetingSelect() {
  const sel = document.getElementById("request-meeting-place");
  if (sel) sel.innerHTML = meetingPlaces.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
}

function openRequestModal(itemId) {
  const item = allItems.find((i) => i.id === itemId);
  requestItemId = itemId;
  const titleEl = document.getElementById("request-item-title");
  if (titleEl) titleEl.textContent = item ? item.itemName : "";
  const msgInput = document.getElementById("request-message");
  if (msgInput) msgInput.value = "";
  const timeInput = document.getElementById("request-meeting-time");
  if (timeInput) timeInput.value = "";
  const errEl = document.getElementById("request-modal-error");
  if (errEl) errEl.textContent = "";
  fillMeetingSelect();
  const modal = document.getElementById("request-modal");
  if (modal) modal.style.display = "flex";
}

function closeRequestModal() {
  requestItemId = null;
  const modal = document.getElementById("request-modal");
  if (modal) modal.style.display = "none";
}

function applyLfFilters(data) {
  let list = data || [];
  if (lfFilter === "lost") list = list.filter((i) => i.type === "lost");
  if (lfFilter === "found") list = list.filter((i) => i.type === "found");
  if (lfSearch) {
    const q = lfSearch.toLowerCase();
    list = list.filter(
      (i) =>
        (i.itemName || "").toLowerCase().includes(q) ||
        (i.location || "").toLowerCase().includes(q)
    );
  }
  return list;
}

async function refresh() {
  const [data, incoming, outgoing] = await Promise.all([
    api("/api/lostfound").catch(() => []),
    api("/api/lostfound/requests/incoming").catch(() => []),
    api("/api/lostfound/requests/outgoing").catch(() => [])
  ]);

  allItems = data || [];
  const filtered = applyLfFilters(allItems);
  const countEl = document.getElementById("lf-count");
  if (countEl) countEl.textContent = `Showing ${filtered.length} open reports on campus`;

  const lostList = document.getElementById("lost-list");
  if (lostList) lostList.innerHTML = listTemplate(filtered.filter((i) => i.type === "lost"));
  const foundList = document.getElementById("found-list");
  if (foundList) foundList.innerHTML = listTemplate(filtered.filter((i) => i.type === "found"));

  document.querySelectorAll(".request-btn").forEach((btn) => {
    btn.addEventListener("click", () => openRequestModal(btn.dataset.id));
  });

  renderIncoming(incoming);
  renderOutgoing(outgoing);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = await api("/api/users/me").catch(() => null);
    meetingPlaces = await api("/api/marketplace/meeting-places").catch(() => []);

    await refresh();

    const lfSearchInput = document.getElementById("lf-search");
    if (lfSearchInput) {
      lfSearchInput.addEventListener("input", () => {
        lfSearch = lfSearchInput.value;
        const filtered = applyLfFilters(allItems);
        const lostList = document.getElementById("lost-list");
        if (lostList) lostList.innerHTML = listTemplate(filtered.filter((i) => i.type === "lost"));
        const foundList = document.getElementById("found-list");
        if (foundList) foundList.innerHTML = listTemplate(filtered.filter((i) => i.type === "found"));
        const countEl = document.getElementById("lf-count");
        if (countEl) countEl.textContent = `Showing ${filtered.length} open reports on campus`;
      });
    }

    document.querySelectorAll("[data-lf-filter]").forEach((chip) => {
      chip.addEventListener("click", async () => {
        document.querySelectorAll("[data-lf-filter]").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        lfFilter = chip.dataset.lfFilter;
        await refresh();
      });
    });

    function bindForm(formId, endpoint) {
      const f = document.getElementById(formId);
      if (!f) return;
      f.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitBtn = f.querySelector("button[type='submit']");
        const origText = submitBtn ? submitBtn.textContent : "Submit";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Posting...";
        }
        try {
          const data = new FormData(event.target);
          await api(endpoint, { method: "POST", body: data });
          event.target.reset();
          await refresh();
        } catch (err) {
          alert(err.message || "Failed to submit report.");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
        }
      });
    }

    bindForm("lost-form", "/api/lostfound/lost");
    bindForm("found-form", "/api/lostfound/found");

    const reqCancel = document.getElementById("request-cancel");
    if (reqCancel) reqCancel.addEventListener("click", closeRequestModal);
    const reqModal = document.getElementById("request-modal");
    if (reqModal) {
      reqModal.addEventListener("click", (e) => {
        if (e.target.id === "request-modal") closeRequestModal();
      });
    }

    const reqSubmit = document.getElementById("request-submit");
    if (reqSubmit) {
      reqSubmit.addEventListener("click", async () => {
        const errEl = document.getElementById("request-modal-error");
        if (errEl) errEl.textContent = "";
        if (!requestItemId) return;

        const message = document.getElementById("request-message").value;
        const meetingPlace = document.getElementById("request-meeting-place").value;
        const meetingTime = document.getElementById("request-meeting-time").value;

        if (!meetingPlace || !meetingTime) {
          if (errEl) errEl.textContent = "Please specify a meeting place and time.";
          return;
        }

        try {
          await api(`/api/lostfound/${requestItemId}/requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, meetingPlace, meetingTime })
          });
          closeRequestModal();
          await refresh();
        } catch (e) {
          if (errEl) errEl.textContent = e.message || "Failed";
        }
      });
    }

    const acceptCancel = document.getElementById("accept-lf-cancel");
    if (acceptCancel) acceptCancel.addEventListener("click", closeAcceptLfModal);
    const acceptModal = document.getElementById("accept-lf-modal");
    if (acceptModal) {
      acceptModal.addEventListener("click", (e) => {
        if (e.target.id === "accept-lf-modal") closeAcceptLfModal();
      });
    }

    const acceptSubmit = document.getElementById("accept-lf-submit");
    if (acceptSubmit) {
      acceptSubmit.addEventListener("click", async () => {
        const errEl = document.getElementById("accept-lf-modal-error");
        if (errEl) errEl.textContent = "";
        if (!acceptLfRequestId) return;
        const meetingPlace = document.getElementById("accept-lf-meeting-place").value;
        const meetingTime = document.getElementById("accept-lf-meeting-time").value;
        if (!meetingTime) {
          if (errEl) errEl.textContent = "Please set a final meeting time.";
          return;
        }
        try {
          const accepted = await api(`/api/lostfound/requests/${acceptLfRequestId}/accept`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingPlace, meetingTime })
          });
          closeAcceptLfModal();
          if (accepted.chatId) {
            window.location.href = `/chat.html?module=lostfound&chat=${accepted.chatId}`;
            return;
          }
          await refresh();
        } catch (e) {
          if (errEl) errEl.textContent = e.message || "Failed";
        }
      });
    }
  } catch (err) {
    console.error("Lost found load error:", err);
  }
});
