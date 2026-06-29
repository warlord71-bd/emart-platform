/**
 * Emart Competitor Price Tracker - Google Apps Script
 * ====================================================
 * Setup:
 *   1. https://sheets.new  create new spreadsheet
 *   2. Extensions > Apps Script > delete default code > paste this
 *   3. Save (Ctrl+S)
 *   4. Deploy > New deployment > Web app
 *      Execute as: Me  |  Who has access: Anyone
 *   5. Deploy > copy the URL
 *   6. On VPS run:
 *      echo 'SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec' >> /root/.openclaw/openclaw.env
 */

var SHEET_LATEST  = 'Latest Run';
var SHEET_HISTORY = 'History';

var HEADERS = [
  'Date',
  'Product',
  'Emart Price (BDT)',
  'Competitor Site',
  'Competitor Price (BDT)',
  'Diff (BDT)',
  'Cheaper By %',
  'Status',
  'Source',
  'Emart URL',
  'Competitor URL'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    writeResults(data);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rows: (data.allResults || []).length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', sheet: SpreadsheetApp.getActiveSpreadsheet().getName() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeResults(data) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var date    = data.date || Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd');
  var results = data.allResults || [];

  // Sheet 1: Latest Run (overwrite every day)
  var latest = ss.getSheetByName(SHEET_LATEST) || ss.insertSheet(SHEET_LATEST);
  latest.clearContents();
  latest.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff');

  var rows = buildRows(results, date);
  if (rows.length) {
    latest.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    applyRowColors(latest, rows, 2);
  }
  latest.autoResizeColumns(1, HEADERS.length);

  // Sheet 2: History (append forever)
  var history = ss.getSheetByName(SHEET_HISTORY);
  if (!history) {
    history = ss.insertSheet(SHEET_HISTORY);
    history.getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#188038')
      .setFontColor('#ffffff');
  }
  if (rows.length) {
    history.getRange(history.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  }
}

function buildRows(results, date) {
  return results.map(function(r) {
    var e      = r.emart    || {};
    var c      = r.cheapest || {};
    var status = c.suspicious ? 'VERIFY' : c.undercut ? 'UNDERCUT' : 'OK';
    return [
      date,
      e.name   || '',
      e.price  || 0,
      c.domain || '',
      c.price  || 0,
      c.diff   || 0,
      (c.diffPct || 0) + '%',
      status,
      c.source || 'page',
      e.url    || '',
      c.url    || ''
    ];
  });
}

function applyRowColors(sheet, rows, startRow) {
  for (var i = 0; i < rows.length; i++) {
    var status = rows[i][7];
    var bg = '#ffffff';
    if (status === 'UNDERCUT') bg = '#fce8e6';
    if (status === 'VERIFY')   bg = '#fef7e0';
    if (status === 'OK')       bg = '#e6f4ea';
    sheet.getRange(startRow + i, 1, 1, HEADERS.length).setBackground(bg);
  }
}
