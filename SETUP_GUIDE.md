# Church Prayer Request Bot — Full Setup Guide

This connects WhatsApp → Google Sheets automatically, live, with priority
flagging for both English and Telugu messages.

**Important reality check:** this works with the official **WhatsApp Cloud
API** — a separate, free, official channel from Meta. It is NOT the same as
reading messages out of your existing WhatsApp Business *app* on your phone.
Those are two different things, and there's no safe/official way to "tap into"
the app directly. The plan below is to get a dedicated number on the Cloud
API, and have your prayer-request volunteer forward/send messages there.

---

## PART 1 — Meta / WhatsApp Cloud API setup (~20-30 min, free)

1. Go to **business.facebook.com** and create a free Meta Business Account if
   you don't have one (use the church's details).
2. Go to **developers.facebook.com** → click **My Apps** → **Create App**.
   - App type: choose **Business**.
   - Name it something like "Church Prayer Bot".
3. In your new app's dashboard, find **WhatsApp** in the product list and
   click **Set Up**.
4. Under **API Setup**, Meta gives you a **free test phone number**
   automatically. (Good enough to fully test everything. You can add your
   real church number later under **Phone Numbers** if you want.)
5. On that same API Setup page, copy and save these two values — you'll need
   them in Part 4:
   - **Temporary access token** (valid 24 hrs — fine for testing; Part 5
     below covers getting a permanent one)
   - **Phone number ID**
6. Under **API Setup**, there's a section to add a **recipient number** for
   testing — add your own personal WhatsApp number there and you'll receive
   a "Hello World" test message. Confirm that arrives. This proves the Meta
   side works.

---

## PART 2 — Google Sheet setup (~10 min, free)

1. Create a new Google Sheet. Rename the first tab to exactly: **Messages**
   (capital M — the code looks for this exact name).
2. Note the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_ID_HERE`**`/edit`
3. Go to **console.cloud.google.com** → create a free project (or reuse one).
4. Enable the **Google Sheets API**: search "Google Sheets API" in the top
   search bar → click **Enable**.
5. Create a **Service Account**:
   - Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**.
   - Any name, e.g. "prayer-bot-sheets".
   - After creating it, click on it → **Keys** tab → **Add Key** → **Create
     new key** → **JSON**. This downloads a `.json` file. **Keep this file
     private — it's a password.**
6. Open the downloaded JSON file, find the `"client_email"` field (looks like
   `something@project-id.iam.gserviceaccount.com`).
7. Go back to your Google Sheet → click **Share** → paste that email in →
   give it **Editor** access → Share. (This is the step people most often
   forget — without it, the bot can see the sheet ID but can't write to it.)

---

## PART 3 — Get the code running locally (~10 min)

1. Make sure **Node.js** is installed on your computer (node.org, get the
   LTS version).
2. Download/copy the project folder I gave you.
3. Put the downloaded service account JSON file inside the project folder,
   rename it to `service-account-key.json`.
4. Copy `.env.example` to a new file named `.env` and fill in the real
   values:
   - `WHATSAPP_TOKEN` → temporary access token from Part 1, step 5
   - `WHATSAPP_PHONE_NUMBER_ID` → phone number ID from Part 1, step 5
   - `WHATSAPP_VERIFY_TOKEN` → make up any password-like string, e.g.
     `church-prayer-2026` — just remember it for Part 4
   - `GOOGLE_SHEET_ID` → from Part 2, step 2
5. Open a terminal in the project folder and run:
   ```
   npm install
   npm start
   ```
   You should see: `Server listening on port 3000`

---

## PART 4 — Test locally WITHOUT WhatsApp (do this first)

Before connecting real WhatsApp, prove the Sheets connection works:

```
node test/simulate-webhook.js
```

This fakes an incoming Telugu message. Check your Google Sheet — a new row
should appear within a few seconds, with Priority = "High" (it's a hospital
message). **If this works, your Google side is correctly wired.** If it
fails, the error message will tell you whether it's a Sheets permission
issue or a missing file issue — fix that before moving to real WhatsApp.

---

## PART 5 — Connect it live to WhatsApp (the "real-time" part)

Your laptop isn't reachable from the internet by default, so Meta can't send
webhooks to `localhost`. Two options:

**Option A — Quick test (temporary, free, good for today's testing):**
1. Install **ngrok** (ngrok.com) — free tier is enough.
2. With your server running (`npm start`), open another terminal:
   ```
   ngrok http 3000
   ```
3. Ngrok gives you a public URL like `https://abcd1234.ngrok-free.app`.
4. In Meta Dashboard → WhatsApp → **Configuration** → **Webhook** → Edit:
   - Callback URL: `https://abcd1234.ngrok-free.app/webhook`
   - Verify token: the same string you put in `WHATSAPP_VERIFY_TOKEN`
   - Click **Verify and Save**.
5. Under **Webhook fields**, subscribe to **messages**.
6. Send a WhatsApp message (from your phone) to the test number from Part 1.
   Watch your terminal log it, and check the Sheet.

   ⚠️ Ngrok free URLs change every time you restart it, and stop when you
   close your laptop — fine for testing today, not for "real-time, always
   on" production use.

**Option B — Permanent, always-on (for going live with the church):**
Deploy the same code to a small free/cheap host (Render.com free tier,
Railway, or similar) so it has a permanent public URL and stays running
24/7 without your laptop. I can walk you through this exact deployment once
Option A is tested and working — it's the same code, just hosted instead of
on your machine.

---

## PART 6 — Permanent access token (before going live for real)

The token from Part 1 expires in 24 hours — fine for testing, not for
production. Once everything works, generate a **permanent token** via a
**System User** in Meta Business Settings (Business Settings → Users →
System Users → Add → generate token with `whatsapp_business_messaging`
permission). I can walk through this in detail once you're at this step.

---

## How your volunteer actually uses this day to day

1. Volunteer monitors the church's regular WhatsApp Business app as usual.
2. When they see a prayer request among the ~900 messages, they **forward
   it** (or retype it) to the dedicated Cloud API number from Part 1.
3. It lands in the Google Sheet automatically within seconds, pre-tagged
   High/Normal priority and Prayer Request/General.
4. Pastor/team opens the live Google Sheet any time, sorts/filters by
   Priority column.

This keeps a human in the loop deciding *what's worth forwarding* (as you
said you wanted), while removing all the manual typing into Excel.
