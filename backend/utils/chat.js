const crypto = require("crypto");

function normalizeChatDb(db) {
  if (!db.chats) db.chats = [];
  if (!db.chatMessages) db.chatMessages = [];
}

function ensureChat(db, { module, requestId, participantIds, itemTitle }) {
  normalizeChatDb(db);
  let chat = db.chats.find((c) => c.module === module && c.requestId === requestId);
  if (!chat) {
    chat = {
      id: crypto.randomUUID(),
      module,
      requestId,
      participantIds: [...new Set(participantIds)],
      itemTitle: itemTitle || "",
      createdAt: new Date().toISOString()
    };
    db.chats.push(chat);
  }
  return chat;
}

function studentById(db, id) {
  return db.students.find((s) => s.id === id);
}

function enrichChatForUser(db, chat, userId) {
  const peerId = chat.participantIds.find((id) => id !== userId);
  const peer = peerId ? studentById(db, peerId) : null;
  const messages = db.chatMessages
    .filter((m) => m.chatId === chat.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = messages[messages.length - 1];
  return {
    id: chat.id,
    module: chat.module,
    requestId: chat.requestId,
    itemTitle: chat.itemTitle,
    peerId: peerId || null,
    peerName: peer ? peer.name : "Unknown",
    peerPhone: peer ? peer.phone || "" : "",
    lastMessage: last ? last.text : null,
    lastMessageAt: last ? last.createdAt : chat.createdAt
  };
}

module.exports = { normalizeChatDb, ensureChat, enrichChatForUser, studentById };
