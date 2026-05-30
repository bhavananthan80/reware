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
  const list = await api(`/api/chats?module=${currentModule}`);
  const el = document.getElementById("chat-list");
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
}

async function openChat(chatId) {
  activeChatId = chatId;
  const data = await api(`/api/chats/${chatId}`);
  document.getElementById("chat-empty").style.display = "none";
  document.getElementById("chat-active").style.display = "flex";
  document.getElementById("chat-item-title").textContent = data.itemTitle || "Chat";
  document.getElementById("chat-peer-line").textContent =
    `${data.peerName} · ${data.peerPhone || "Phone not set"} · You: ${data.myPhone || "—"}`;

  renderMessages(data.messages, data.myName);
  await loadChatList();

  const params = new URLSearchParams(location.search);
  params.set("chat", chatId);
  params.set("module", currentModule);
  history.replaceState(null, "", `${location.pathname}?${params}`);
}

function renderMessages(messages, myName) {
  const box = document.getElementById("chat-messages");
  if (!messages.length) {
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
  const data = await api(`/api/chats/${activeChatId}`);
  renderMessages(data.messages);
}

document.addEventListener("DOMContentLoaded", async () => {
  const me = await api("/api/users/me");
  currentUserId = me.id;

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
      document.getElementById("chat-active").style.display = "none";
      document.getElementById("chat-empty").style.display = "block";
      await loadChatList();
    });
  });

  await loadChatList();

  const chatParam = params.get("chat");
  if (chatParam) await openChat(chatParam);

  document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeChatId) return;
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    await api(`/api/chats/${activeChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    input.value = "";
    await refreshActiveChat();
    await loadChatList();
  });

  pollTimer = setInterval(refreshActiveChat, 5000);
});
