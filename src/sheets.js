// src/sheets.js
const { google } = require("googleapis");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB_NAME = "Messages";

let sheetsClient = null;

// Create Google Sheets client using ENV credentials
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  // Safety check
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY in environment variables");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  sheetsClient = google.sheets({ version: "v4", auth: authClient });

  return sheetsClient;
}

// Ensure header exists
async function ensureHeaderRow() {
  try {
    const sheets = await getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A1:F1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_NAME}!A1:F1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["Date/Time", "Sender Name", "Phone Number", "Message", "Priority", "Category"],
          ],
        },
      });
    }
  } catch (err) {
    console.error("Error ensuring header row:", err.message);
  }
}

// Append new row
async function appendRow({ timestamp, senderName, phoneNumber, message, priority, category }) {
  try {
    const sheets = await getSheetsClient();

    await ensureHeaderRow();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[timestamp, senderName, phoneNumber, message, priority, category]],
      },
    });

    console.log("✅ Row added to Google Sheet");
  } catch (err) {
    console.error("❌ Error writing to Google Sheets:", err.message);
  }
}

module.exports = { appendRow };