// ============================================================
//  J&P Banquet Hall – Google Apps Script Backend
//  UPDATED: Contacts sheet now stores package & guestCount
// ============================================================

function doPost(e) {
  try {
    const action = e.parameter.action;
    const bodyStr = e.parameter.data;
    const body = bodyStr ? JSON.parse(bodyStr) : null;
    let data;

    if (action === 'login') data = handleLogin(body);
    else if (action === 'getPackages') data = getPackages();
    else if (action === 'addPackage') data = addPackage(body);
    else if (action === 'editPackage') data = editPackage(body);
    else if (action === 'deletePackage') data = deletePackage(body.id);

    else if (action === 'getGallery') data = getGallery();
    else if (action === 'addGallery') data = addGallery(body);
    else if (action === 'editGallery') data = editGallery(body);
    else if (action === 'deleteGallery') data = deleteGallery(body.id);

    else if (action === 'getBookings') data = getBookings();
    else if (action === 'addBooking') data = addBooking(body);
    else if (action === 'editBooking') data = editBooking(body);
    else if (action === 'deleteBooking') data = deleteBooking(body.id);

    else if (action === 'getContacts') data = getContacts();
    else if (action === 'addContact') data = addContact(body);
    else if (action === 'updateContactStatus') data = updateContactStatus(body);

    else throw new Error('Unknown action: ' + action);

    return formatResponse({ status: 'success', data: data });
  } catch (error) {
    return formatResponse({ status: 'error', error: error.message || 'Operation failed' });
  }
}

function handleLogin(body) {
  const props = PropertiesService.getScriptProperties();
  const validUser = props.getProperty('ADMIN_USERNAME') || 'admin';
  const validPass = props.getProperty('ADMIN_PASSWORD') || 'jandp@2025';
  if (body.username === validUser && body.password === validPass) {
    return { success: true };
  } else {
    throw new Error('Invalid username or password.');
  }
}

function formatResponse(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getSheetByName(name) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID script property is not set.');
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

function rowToObj(row, cols) {
  const obj = {};
  cols.forEach((col, i) => obj[col] = row[i] || '');
  return obj;
}

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch(e) { return fallback; }
}

// --- PACKAGES ---
const PKG_COLS = ['id', 'name', 'price', 'icon', 'per', 'status', 'description', 'inclusions', 'exclusions'];

function getPackages() {
  const sheet = getSheetByName('Packages');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => {
    let obj = rowToObj(row, PKG_COLS);
    obj.inclusions = safeParse(obj.inclusions, []);
    obj.exclusions = safeParse(obj.exclusions, []);
    return obj;
  });
}

function addPackage(body) {
  const sheet = getSheetByName('Packages');
  const id = Utilities.getUuid();
  const inclusions = JSON.stringify(body.inclusions || []);
  const exclusions = JSON.stringify(body.exclusions || []);
  sheet.appendRow([
    id, body.name, body.price, body.icon || '', body.per || '/ event',
    body.status || 'active', body.description || '', inclusions, exclusions
  ]);
  return { id };
}

function editPackage(body) {
  const sheet = getSheetByName('Packages');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.id) {
      const inclusions = JSON.stringify(body.inclusions || []);
      const exclusions = JSON.stringify(body.exclusions || []);
      const rowNum = i + 1;
      sheet.getRange(rowNum, 1, 1, 9).setValues([[
        body.id, body.name, body.price, body.icon || '', body.per || '/ event',
        body.status || 'active', body.description || '', inclusions, exclusions
      ]]);
      return { id: body.id };
    }
  }
  throw new Error('Package not found');
}

function deletePackage(id) {
  const sheet = getSheetByName('Packages');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Package not found');
}

// --- GALLERY ---
const GAL_COLS = ['id', 'title', 'category', 'photoUrl', 'description', 'status'];

function getGallery() {
  const sheet = getSheetByName('Gallery');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => rowToObj(row, GAL_COLS));
}

function addGallery(body) {
  const sheet = getSheetByName('Gallery');
  const id = Utilities.getUuid();
  sheet.appendRow([
    id, body.title, body.category || '', body.photoUrl || '',
    body.description || '', body.status || 'active'
  ]);
  return { id };
}

function editGallery(body) {
  const sheet = getSheetByName('Gallery');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.id) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[
        body.id, body.title, body.category || '', body.photoUrl || '',
        body.description || '', body.status || 'active'
      ]]);
      return { id: body.id };
    }
  }
  throw new Error('Gallery item not found');
}

function deleteGallery(id) {
  const sheet = getSheetByName('Gallery');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Gallery item not found');
}

// --- BOOKINGS ---
const BOOK_COLS = ['id','clientName','phone','email','eventType','eventDate','guestCount','package','amount','status','notes'];

function getBookings() {
  const sheet = getSheetByName('Bookings');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => rowToObj(row, BOOK_COLS));
}

function addBooking(body) {
  const sheet = getSheetByName('Bookings');
  const id = Utilities.getUuid();
  sheet.appendRow([
    id, body.clientName, body.phone || '', body.email || '',
    body.eventType || '', body.eventDate || '', body.guestCount || '',
    body.package || '', body.amount || '', body.status || 'pending', body.notes || ''
  ]);
  return { id };
}

function editBooking(body) {
  const sheet = getSheetByName('Bookings');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.id) {
      sheet.getRange(i + 1, 1, 1, 11).setValues([[
        body.id, body.clientName, body.phone || '', body.email || '',
        body.eventType || '', body.eventDate || '', body.guestCount || '',
        body.package || '', body.amount || '', body.status || 'pending', body.notes || ''
      ]]);
      return { id: body.id };
    }
  }
  throw new Error('Booking not found');
}

function deleteBooking(id) {
  const sheet = getSheetByName('Bookings');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Booking not found');
}

// --- CONTACTS --- ✅ UPDATED: now includes package & guestCount ---
// Column order: id | name | phone | eventType | eventDate | guestCount | package | message | submittedAt | status
const CONTACT_COLS = ['id','name','phone','eventType','eventDate','guestCount','package','message','submittedAt','status'];

function getContacts() {
  const sheet = getSheetByName('Contacts');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => rowToObj(row, CONTACT_COLS));
}

function addContact(body) {
  const sheet = getSheetByName('Contacts');
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    body.name        || '',
    body.phone       || '',
    body.eventType   || '',
    body.eventDate   || '',
    body.guestCount  || '',
    body.package     || '',
    body.message     || '',
    new Date().toISOString(),
    'new'
  ]);
  return { id };
}

function updateContactStatus(body) {
  const sheet = getSheetByName('Contacts');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.id) {
      // status is column 10 (index 9) in the new layout
      sheet.getRange(i + 1, 10).setValue(body.status);
      return { id: body.id };
    }
  }
  throw new Error('Contact not found');
}

// --- SETUP SHEETS (run once) ---
// ⚠️  Run this from Apps Script editor: select setupSheets → click ▶ Run
function setupSheets() {
  const ss = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
  );

  function ensureSheet(name, headers) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    return sheet;
  }

  ensureSheet('Packages',  ['id','name','price','icon','per','status','description','inclusions','exclusions']);
  ensureSheet('Gallery',   ['id','title','category','photoUrl','description','status']);
  ensureSheet('Bookings',  ['id','clientName','phone','email','eventType','eventDate','guestCount','package','amount','status','notes']);
  ensureSheet('Contacts',  ['id','name','phone','eventType','eventDate','guestCount','package','message','submittedAt','status']);
  Logger.log('All sheets set up successfully!');

  // Apply color formatting automatically
  formatSheets();
}

// --- FORMAT SHEETS WITH COLORS ---
// Run this anytime to reapply beautiful colors to all sheet headers
function formatSheets() {
  const ss = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
  );

  // Color themes for each sheet
  const THEMES = {
    'Packages' : { header: '#4A235A', sub: '#D2B4DE', alt: '#F9F0FF' }, // Royal Purple
    'Gallery'  : { header: '#1A5276', sub: '#AED6F1', alt: '#EBF5FB' }, // Ocean Blue
    'Bookings' : { header: '#145A32', sub: '#A9DFBF', alt: '#EAFAF1' }, // Emerald Green
    'Contacts' : { header: '#784212', sub: '#FAD7A0', alt: '#FEF9E7' }, // Warm Gold/Amber
  };

  Object.entries(THEMES).forEach(([sheetName, theme]) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return;

    // ── Header row ──────────────────────────────────────
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange
      .setBackground(theme.header)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Freeze header row & set height
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);

    // ── Alternating row colors for existing data ─────────
    const lastRow = Math.max(sheet.getLastRow(), 2);
    if (lastRow > 1) {
      for (let r = 2; r <= lastRow; r++) {
        const rowRange = sheet.getRange(r, 1, 1, lastCol);
        rowRange.setBackground(r % 2 === 0 ? '#FFFFFF' : theme.alt)
                .setFontColor('#2C3E50')
                .setFontSize(10);
      }
    }

    // ── Auto-resize all columns ──────────────────────────
    for (let c = 1; c <= lastCol; c++) {
      sheet.autoResizeColumn(c);
      // Minimum width of 100px
      if (sheet.getColumnWidth(c) < 100) sheet.setColumnWidth(c, 100);
    }

    // ── Add border to header ─────────────────────────────
    headerRange.setBorder(true, true, true, true, true, true,
      theme.sub, SpreadsheetApp.BorderStyle.SOLID);

    Logger.log(`✅ Formatted sheet: ${sheetName}`);
  });

  Logger.log('🎨 All sheets beautifully formatted!');
}

