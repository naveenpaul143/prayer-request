// src/classify.js
// Looks at the message text and decides:
//   1) priority: "High" | "Normal"
//   2) category: "Prayer Request" | "General"
// Works on English text AND Telugu script - no translation needed,
// we just match known words in both languages.

// Add/remove words here any time - no code changes needed elsewhere.
const HIGH_PRIORITY_WORDS = [
  // English
  "urgent", "emergency", "hospital", "icu", "surgery", "operation",
  "accident", "critical", "dying", "death", "died", "expired",
  "cancer", "covid", "serious condition", "please pray urgently",
  "admitted", "bleeding", "heart attack", "stroke", "coma",

  // Telugu (common words used in prayer requests)
  "ఆసుపత్రి",      // hospital
  "అత్యవసరం",      // urgent/emergency
  "ఆపరేషన్",       // operation
  "ప్రాణాపాయం",    // life-threatening
  "మరణం",          // death
  "చనిపోయా",       // died
  "క్యాన్సర్",      // cancer
  "సీరియస్",        // serious
  "ఐసీయూ",         // ICU
  "వెంటనే ప్రార్థన", // pray immediately
  "ప్రమాదం",        // accident
];

// Family functions / invitations - these are NOT prayer requests, just
// announcements. Keep priority low (General) even if other words overlap.
const FUNCTION_INVITE_WORDS = [
  // English
  "invitation", "invite", "reception", "marriage function", "wedding function",
  "engagement", "house warming", "housewarming", "birthday function",
  "anniversary function", "naming ceremony", "baby shower function",
  "please come", "please attend", "cordially invited", "kindly join us",

  // Telugu script
  "ఆహ్వానం",      // invitation
  "పెళ్లి",         // marriage/wedding
  "రిసెప్షన్",      // reception
  "శుభకార్యం",     // auspicious function/event
];

const PRAYER_REQUEST_WORDS = [
  // English
  "pray", "prayer", "praying", "please pray", "intercede", "blessing",
  "healing", "heal me", "god help", "lord help", "miracle",

  // Telugu script
  "ప్రార్థన",       // prayer
  "ప్రార్థించండి",   // please pray
  "దేవుడు",          // God
  "ఆశీర్వాదం",       // blessing
  "స్వస్థత",          // healing
  "అద్భుతం",         // miracle

  // Romanized Telugu ("Tenglish") - VERY common in real WhatsApp messages.
  // People often write Telugu using English letters instead of script.
  "cheyandi", "cheyali", "cheyyandi", "chesthe", // "please do" (as in "prayer cheyandi")
  "ayya", "ayya garu", "anna", "akka",            // respectful address, often opens a request
  "kosam",                                         // "for the sake of / for"
  "dawa", "daya",                                  // mercy/grace
];

// Genuine personal-need words: pregnancy, job, exams, etc. These usually
// ARE real prayer requests (just not emergencies) - so they're Normal
// priority, Prayer Request category. Family-function/invite words are
// handled separately above and kept out of this list on purpose.
const LIFE_NEED_WORDS = [
  "salary", "job", "exam", "result", "pregnant", "pregnancy", "delivery",
  "baby", "child birth", "visa", "interview", "court case", "debt", "loan",
  "business", "job loss", "unemployment", "exam fear",
];

function containsAny(text, wordList) {
  const lower = text.toLowerCase();
  return wordList.some((word) => lower.includes(word.toLowerCase()));
}

function classifyMessage(text) {
  if (!text || typeof text !== "string") {
    return { priority: "Normal", category: "General" };
  }

  const isFunctionInvite = containsAny(text, FUNCTION_INVITE_WORDS);
  const isHighPriority = containsAny(text, HIGH_PRIORITY_WORDS);
  const hasPrayerWord = containsAny(text, PRAYER_REQUEST_WORDS);
  const hasLifeNeedWord = containsAny(text, LIFE_NEED_WORDS);

  // Rule 1: Family functions/invitations are always General, low priority -
  // even if the message happens to also contain a word like "blessing".
  // Checked FIRST so it always wins for this category of message.
  if (isFunctionInvite && !isHighPriority) {
    return { priority: "Normal", category: "General" };
  }

  // Rule 2: True emergencies (hospital, death, accident, etc.) are always
  // High priority and logged as a Prayer Request.
  if (isHighPriority) {
    return { priority: "High", category: "Prayer Request" };
  }

  // Rule 3: Genuine personal needs (job, exam, pregnancy, etc.) or explicit
  // prayer language - real requests, but not emergencies, so Normal priority.
  if (hasPrayerWord || hasLifeNeedWord) {
    return { priority: "Normal", category: "Prayer Request" };
  }

  // Rule 4: Everything else (general chat, greetings, announcements) -
  // logged but not treated as a prayer request.
  return { priority: "Normal", category: "General" };
}

module.exports = { classifyMessage };