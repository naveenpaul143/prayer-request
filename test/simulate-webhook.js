// test/simulate-webhook.js
//
// This sends a FAKE WhatsApp message to your own running server,
// so you can test everything end-to-end BEFORE connecting a real
// Meta/WhatsApp account.
//
// HOW TO USE:
//   1. In one terminal: npm start
//   2. In another terminal: node test/simulate-webhook.js
//   3. Check your Google Sheet - a new row should appear within seconds.

const http = require("http");

const fakeMessage = {
  entry: [
    {
      changes: [
        {
          value: {
            contacts: [{ profile: { name: "Test User (Telugu)" }, wa_id: "919999999999" }],
            messages: [
              {
                from: "919999999999",
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: "text",
                text: { 
                  
                  // body: "నా అమ్మ ఆసుపత్రి లో ఉంది, దయచేసి ప్రార్థన చేయండి" }
                   body: "ayyagaru vandhanalu ma marriage ki meru ravali e month 26 na" }, // "My mother is in hospital, please pray"
              },
            ],
          },
        },
      ],
    },
  ],
};

const data = JSON.stringify(fakeMessage);

const options = {
  hostname: "localhost",
  port: process.env.PORT || 3000,
  path: "/webhook",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log("If this is 200, check your Google Sheet now for a new row.");
});

req.on("error", (err) => {
  console.error("Could not reach local server. Is it running? (npm start)", err.message);
});

req.write(data);
req.end();
