// src/server.js
require("dotenv").config();
const express = require("express");
const { classifyMessage } = require("./classify");
const { appendRow } = require("./sheets");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// 1) WEBHOOK VERIFICATION (Meta calls this once, when you click
//    "Verify and Save" in the Meta Dashboard webhook setup screen)
// ---------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully.");
    return res.status(200).send(challenge);
  }
  console.warn("Webhook verification failed. Check your verify token.");
  return res.sendStatus(403);
});

// ---------------------------------------------------------------
// 2) INCOMING MESSAGES (Meta POSTs here every time someone
//    sends a WhatsApp message to your business number)
// ---------------------------------------------------------------
app.post("/webhook", async (req, res) => {
  // Always respond 200 fast - Meta retries aggressively if you don't.
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return; // could be a status update (delivered/read), not a message
    }

    for (const msg of messages) {
      const phoneNumber = msg.from; // sender's WhatsApp number
      const contact = value.contacts?.find((c) => c.wa_id === phoneNumber);
      const senderName = contact?.profile?.name || "Unknown";

      // Handle text messages (most prayer requests will be plain text)
      const text = msg.text?.body || (msg.type !== "text" ? `[${msg.type} message - not text]` : "");

      const { priority, category } = classifyMessage(text);

      const timestamp = new Date(parseInt(msg.timestamp, 10) * 1000).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      console.log(`New message from ${senderName} (${phoneNumber}): "${text}" -> ${priority}/${category}`);

      await appendRow({
        timestamp,
        senderName,
        phoneNumber,
        message: text,
        priority,
        category,
      });
    }
  } catch (err) {
    console.error("Error processing incoming webhook:", err);
  }
});

// Simple health check - visit this URL in a browser to confirm the server is alive
app.get("/", (req, res) => {
  res.send("WhatsApp Prayer Request Bot is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
