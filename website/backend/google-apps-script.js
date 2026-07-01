const SHEET_NAMES = {
  member: "Members",
  volunteer: "Volunteers",
  contact: "Contacts"
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const type = payload.type || "member";
    const sheet = getSheet_(SHEET_NAMES[type] || "Submissions");
    const headers = ensureHeaders_(sheet, Object.keys(payload));
    const row = headers.map((key) => payload[key] || "");
    sheet.appendRow(row);
    return json_({ ok: true, id: payload.membershipId || "" });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet() {
  return json_({ ok: true, service: "18 Village People Trust API" });
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureHeaders_(sheet, keys) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String);
  const headers = existing.length ? existing : keys;
  const missing = keys.filter((key) => !headers.includes(key));
  const nextHeaders = headers.concat(missing);
  sheet.getRange(1, 1, 1, nextHeaders.length).setValues([nextHeaders]);
  return nextHeaders;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
