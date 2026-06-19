// src/sheets.js
const { google } = require("googleapis");
const path = require("path");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || "./service-account-key.json";
const TAB_NAME = "Messages"; // must match the tab name in your Google Sheet

let sheetsClient = null;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(KEY_PATH),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  sheetsClient = google.sheets({ version: "v4", auth: authClient });
  return sheetsClient;
}

// Creates the header row if the sheet is empty. Safe to call every time.
async function ensureHeaderRow() {
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
        values: [["Date/Time", "Sender Name", "Phone Number", "Message", "Priority", "Category"]],
      },
    });
  }
}

async function appendRow({ timestamp, senderName, phoneNumber, message, priority, category }) {
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
}

module.exports = { appendRow };
