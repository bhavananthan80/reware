const crypto = require("crypto");

function normalizeNotificationsDb(db) {
  if (!db.notifications) db.notifications = [];
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (String(phone).startsWith("+")) return String(phone).replace(/\s/g, "");
  return `+${digits}`;
}

async function sendSms(phone, body) {
  const to = formatPhone(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[REWARE SMS] To ${to}: ${body}`);
    return { ok: true, mode: "dev_log" };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1500) });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Twilio error:", errText);
      return { ok: false, reason: "twilio_error" };
    }
    return { ok: true, mode: "twilio" };
  } catch (e) {
    console.error("SMS send failed:", e.message);
    return { ok: false, reason: "network_error" };
  }
}

function notify(db, { userId, type, title, message, link, smsBody }) {
  normalizeNotificationsDb(db);
  const student = db.students.find((s) => s.id === userId);
  const entry = {
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    message,
    link: link || "",
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(entry);

  if (student && student.phone && smsBody) {
    sendSms(student.phone, smsBody).catch(() => {});
  }
  return entry;
}

module.exports = { normalizeNotificationsDb, notify, sendSms, formatPhone };
