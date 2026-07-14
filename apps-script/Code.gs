/**
 * Setter EOD backend — lives inside the Google Sheet.
 *
 * Setup (once):
 *   1. Create a blank Google Sheet (sheets.new)
 *   2. Extensions → Apps Script, delete any code there, paste this file
 *   3. Deploy → New deployment → type "Web app"
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec) — that's the backend URL.
 *
 * The script creates two tabs automatically:
 *   Reports — one row per setter per day (re-submits update the row)
 *   Setters — type your setters' names in column A (below the header)
 */

var METRIC_KEYS = [
  "dials_made", "pickups", "meetings_proposed", "meetings_booked_dials",
  "email_responses", "email_meetings_proposed", "meetings_booked_email",
  "li_connection_requests", "li_accepts", "li_dms_sent", "li_replies",
  "li_positive_replies", "meetings_booked_linkedin",
  "hiring_messages_sent", "hiring_links_sent", "hiring_applications",
  "misc_messages_sent", "misc_dials_made", "misc_meetings_proposed",
  "misc_meetings_booked"
];

var HEADERS = ["report_date", "setter_name", "hours_worked"]
  .concat(METRIC_KEYS)
  .concat(["notes", "objections_heard", "submitted_at"]);

function getSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function asDateString_(value) {
  if (value && typeof value.getTime === "function") {
    return Utilities.formatDate(
      new Date(value.getTime()),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }
  return String(value);
}

function doGet() {
  var reportsSheet = getSheet_("Reports", HEADERS);
  var settersSheet = getSheet_("Setters", ["Name"]);

  var setters = settersSheet
    .getRange(2, 1, Math.max(settersSheet.getLastRow() - 1, 1), 1)
    .getValues()
    .map(function (row) { return String(row[0]).trim(); })
    .filter(function (name) { return name !== ""; });

  var lastRow = reportsSheet.getLastRow();
  var reports = [];
  if (lastRow > 1) {
    var values = reportsSheet
      .getRange(2, 1, lastRow - 1, HEADERS.length)
      .getValues();
    reports = values.map(function (row) {
      var obj = {};
      HEADERS.forEach(function (header, i) {
        if (header === "report_date" || header === "submitted_at") {
          obj[header] = asDateString_(row[i]);
        } else if (
          header === "setter_name" ||
          header === "notes" ||
          header === "objections_heard"
        ) {
          obj[header] = String(row[i]);
        } else {
          obj[header] = Number(row[i]) || 0;
        }
      });
      return obj;
    });
  }

  return json_({ ok: true, setters: setters, reports: reports });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.setter_name || !body.report_date) {
      return json_({ ok: false, error: "setter_name and report_date required" });
    }

    var sheet = getSheet_("Reports", HEADERS);
    var row = HEADERS.map(function (header) {
      if (header === "submitted_at") return new Date().toISOString();
      var value = body[header];
      if (header === "report_date" || header === "setter_name") {
        return String(value);
      }
      if (header === "notes" || header === "objections_heard") {
        return value == null ? "" : String(value);
      }
      return Number(value) || 0;
    });

    // Upsert: one row per (setter_name, report_date)
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    if (lastRow > 1) {
      var keys = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < keys.length; i++) {
        if (
          asDateString_(keys[i][0]) === String(body.report_date) &&
          String(keys[i][1]) === String(body.setter_name)
        ) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
