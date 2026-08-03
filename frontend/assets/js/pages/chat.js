requireAuth();

let currentModule = "marketplace";
let activeChatId = null;
let currentUserId = null;
let pollTimer = null;

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function moduleLabel(module) {
  return module === "lostfound" ? "Lost & Found" : "REWARE";
}

async function loadChatList() {
  try {
    const list = (await api(`/api/chats?module=${currentModule}`).catch(() => [])) || [];
    const el = document.getElementById("chat-list");
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<p class="muted">No ${moduleLabel(currentModule)} chats yet. Accept a request to open a conversation.</p>`;
      return;
    }
    el.innerHTML = list
      .map(
        (c) => `
      <button type="button" class="chat-list-item ${c.id === activeChatId ? "active" : ""}" data-chat-id="${c.id}">
        <div class="chat-list-title">${escapeHtml(c.itemTitle || "Conversation")}</div>
        <div class="chat-list-meta">${escapeHtml(c.peerName)} · ${escapeHtml(c.peerPhone || "No phone")}</div>
        ${c.lastMessage ? `<div class="chat-list-preview">${escapeHtml(c.lastMessage)}</div>` : ""}
      </button>
    `
      )
      .join("");

    el.querySelectorAll(".chat-list-item").forEach((btn) => {
      btn.addEventListener("click", () => openChat(btn.dataset.chatId));
    });
  } catch (err) {
    console.error("Load chat list error:", err);
  }
}

async function openChat(chatId) {
  try {
    activeChatId = chatId;
    const data = await api(`/api/chats/${chatId}`);
    const emptyEl = document.getElementById("chat-empty");
    if (emptyEl) emptyEl.style.display = "none";
    const activeEl = document.getElementById("chat-active");
    if (activeEl) activeEl.style.display = "flex";
    const titleEl = document.getElementById("chat-item-title");
    if (titleEl) titleEl.textContent = data.itemTitle || "Chat";
    const peerEl = document.getElementById("chat-peer-line");
    if (peerEl) {
      peerEl.textContent = `${data.peerName} · ${data.peerPhone || "Phone not set"} · You: ${data.myPhone || "—"}`;
    }

    renderMessages(data.messages || [], data.myName);
    await loadChatList();

    const params = new URLSearchParams(location.search);
    params.set("chat", chatId);
    params.set("module", currentModule);
    history.replaceState(null, "", `${location.pathname}?${params}`);
  } catch (err) {
    console.error("Open chat error:", err);
  }
}

function renderMessages(messages, myName) {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  if (!messages || !messages.length) {
    box.innerHTML = "<p class='muted' style='padding:12px;'>No messages yet. Say hello!</p>";
    return;
  }
  box.innerHTML = messages
    .map((m) => {
      const mine = m.senderId === currentUserId;
      return `
      <div class="chat-bubble ${mine ? "mine" : "theirs"}">
        <div class="chat-bubble-text">${escapeHtml(m.text)}</div>
        <div class="chat-bubble-time">${new Date(m.createdAt).toLocaleString()}</div>
      </div>
    `;
    })
    .join("");
  box.scrollTop = box.scrollHeight;
}

async function refreshActiveChat() {
  if (!activeChatId) return;
  try {
    const data = await api(`/api/chats/${activeChatId}`);
    if (data && data.messages) renderMessages(data.messages);
  } catch (_e) {}
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await api("/api/users/me").catch(() => null);
    if (me) currentUserId = me.id;

    const params = new URLSearchParams(location.search);
    if (params.get("module") === "lostfound") {
      currentModule = "lostfound";
      document.querySelectorAll(".chat-module-tabs .chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.module === "lostfound");
      });
    }

    document.querySelectorAll(".chat-module-tabs .chip").forEach((chip) => {
      chip.addEventListener("click", async () => {
        document.querySelectorAll(".chat-module-tabs .chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        currentModule = chip.dataset.module;
        activeChatId = null;
        const activeEl = document.getElementById("chat-active");
        if (activeEl) activeEl.style.display = "none";
        const emptyEl = document.getElementById("chat-empty");
        if (emptyEl) emptyEl.style.display = "block";
        await loadChatList();
      });
    });

    await loadChatList();

    const chatParam = params.get("chat");
    if (chatParam) await openChat(chatParam);

    const chatForm = document.getElementById("chat-form");
    if (chatForm) {
      chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeChatId) return;
        const input = document.getElementById("chat-input");
        const text = input ? input.value.trim() : "";
        if (!text) return;
        try {
          await api(`/api/chats/${activeChatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
          });
          if (input) input.value = "";
          await refreshActiveChat();
          await loadChatList();
        } catch (err) {
          alert(err.message || "Could not send message.");
        }
      });
    }

    pollTimer = setInterval(refreshActiveChat, 5000);
  } catch (err) {
    console.error("Chat page error:", err);
  }
});
