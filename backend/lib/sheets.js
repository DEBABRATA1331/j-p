/**
 * Google Sheets helper using googleapis
 * Reads/writes to the J&P Banquet spreadsheet
 */

const { google } = require('googleapis');

function checkConfig() {
  const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!creds || creds === '{}' || !sheetId || sheetId === 'your-google-sheet-id-here') {
    throw new Error('Google Sheets not configured yet. Add GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON to your .env file.');
  }
}

function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

/** Get all rows from a named sheet tab */
async function getSheetData(sheetName) {
  checkConfig();
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return res.data.values || [];
}

/** Append a new row at the bottom of a sheet */
async function appendRow(sheetName, row) {
  checkConfig();
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

/** Update a specific row by 1-based row number */
async function updateRow(sheetName, rowNumber, row) {
  checkConfig();
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

/** Delete a row by 1-based row number (clears then shifts via batchUpdate) */
async function deleteRow(sheetName, rowNumber) {
  checkConfig();
  const sheets = await getSheetsClient();

  // First get sheetId for the tab name
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet tab "${sheetName}" not found`);
  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowNumber - 1, // 0-based
            endIndex: rowNumber
          }
        }
      }]
    }
  });
}

module.exports = { getSheetData, appendRow, updateRow, deleteRow };
