/*
  THIS IS A BLANK TEMPLATE. Keep this template blank in GitHub.

  In Google Apps Script: + -> Script -> name it PrivateSettings.
  Paste this code there, and enter your values BETWEEN the quotes below.
  Code.gs will read these values automatically.

  If filling a local copy, name it PrivateSettings.gs (Git-ignored).
  Never upload the filled file to GitHub or put it beside public HTML.
*/
var PRIVATE_SETTINGS = {
  // New token from BotFather. Revoke the previously exposed token first.
  TELEGRAM_BOT_TOKEN: '',

  // Personal Telegram user IDs separated by commas; each person must Start the bot.
  TELEGRAM_CHAT_IDS: '',

  // Only the ID between /d/ and /edit in your Google Sheets URL.
  SPREADSHEET_ID: '',

  // Alternatively paste the full Google Sheets URL ONLY in the private Google project.
  SPREADSHEET_URL: '',

  // A random 32+ character secret, identical to Vercel APPS_SCRIPT_SECRET.
  APPS_SCRIPT_SECRET: '',

  // Daily sheet dates and times (Kyrgyzstan).
  SHEET_TIMEZONE: 'Asia/Bishkek'
};
