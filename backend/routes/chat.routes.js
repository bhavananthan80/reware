const express = require("express");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth.middleware");
const { readDb, writeDb } = require("../utils/db");
const { normalizeChatDb, enrichChatForUser, studentById } = require("../utils/chat");
const { awardPoints } = require("../utils/points");
const { notify } = require("../utils/notifications");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const module = req.query.module;
  const db = readDb();
  normalizeChatDb(db);
  const userId = req.user.studentId;

  let chats = db.chats
    .filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => {
      const aLast = enrichChatForUser(db, a, userId).lastMessageAt;
      const bLast = enrichChatForUser(db, b, userId).lastMessageAt;
      return bLast.localeCompare(aLast);
    });

  if (module === "marketplace" || module === "lostfound") {
    chats = chats.filter((c) => c.module === module);
  }

  res.json(chats.map((c) => enrichChatForUser(db, c, userId)));
});

router.get("/:chatId", authMiddleware, (req, res) => {
  const db = readDb();
  normalizeChatDb(db);
  const userId = req.user.studentId;
  const chat = db.chats.find((c) => c.id === req.params.chatId);

  if (!chat || !chat.participantIds.includes(userId)) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const peerId = chat.participantIds.find((id) => id !== userId);
  const peer = peerId ? studentById(db, peerId) : null;
  const me = studentById(db, userId);
  const messages = db.chatMessages
    .filter((m) => m.chatId === chat.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  res.json({
    id: chat.id,
    module: chat.module,
    itemTitle: chat.itemTitle,
    peerName: peer ? peer.name : "Unknown",
    peerPhone: peer ? peer.phone || "" : "",
    myName: me ? me.name : "",
    myPhone: me ? me.phone || "" : "",
    messages
  });
});

router.post("/:chatId/messages", authMiddleware, (req, res) => {
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    return res.status(400).json({ message: "Message text is required" });
  }

  const db = readDb();
  normalizeChatDb(db);
  const userId = req.user.studentId;
  const chat = db.chats.find((c) => c.id === req.params.chatId);

  if (!chat || !chat.participantIds.includes(userId)) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const message = {
    id: crypto.randomUUID(),
    chatId: chat.id,
    senderId: userId,
    text: text.slice(0, 2000),
    createdAt: new Date().toISOString()
  };
  db.chatMessages.push(message);
  const peerId = chat.participantIds.find((id) => id !== userId);
  const sender = studentById(db, userId);
  awardPoints(db, userId, "CHAT_ENGAGEMENT");
  if (peerId) {
    notify(db, {
      userId: peerId,
      type: "chat_message",
      title: "New chat message",
      message: `${sender ? sender.name : "Someone"}: ${text.slice(0, 80)}`,
      link: `/chat.html?module=${chat.module}&chat=${chat.id}`,
      smsBody: `REWARE: New message from ${sender ? sender.name : "a student"} about "${chat.itemTitle}". Open Chat in the app.`
    });
  }
  writeDb(db);
  res.status(201).json(message);
});

module.exports = router;
