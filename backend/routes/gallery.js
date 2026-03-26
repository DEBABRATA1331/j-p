/**
 * Gallery Routes – CRUD via Google Sheets
 * Sheet name: "Gallery"
 * Columns: A=id | B=title | C=category | D=photoUrl | E=description | F=status
 */

const express = require('express');
const router = express.Router();
const { getSheetData, appendRow, updateRow, deleteRow } = require('../lib/sheets');
const { v4: uuidv4 } = require('uuid');

const SHEET = 'Gallery';
const COLS = ['id', 'title', 'category', 'photoUrl', 'description', 'status'];

function rowToObj(row) {
  const obj = {};
  COLS.forEach((col, i) => obj[col] = row[i] || '');
  return obj;
}

// GET /api/gallery
router.get('/', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const data = rows.slice(1).map(rowToObj); // skip header row
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/gallery/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const row = rows.slice(1).find(r => r[0] === req.params.id);
    if (!row) return res.status(404).json({ message: 'Item not found' });
    res.json(rowToObj(row));
  } catch (err) { next(err); }
});

// POST /api/gallery
router.post('/', async (req, res, next) => {
  try {
    const { title, category, photoUrl, description, status } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const id = uuidv4();
    const newRow = [id, title || '', category || '', photoUrl || '', description || '', status || 'active'];
    await appendRow(SHEET, newRow);
    res.status(201).json({ id, message: 'Gallery item added.' });
  } catch (err) { next(err); }
});

// PUT /api/gallery/:id
router.put('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const rowIndex = rows.slice(1).findIndex(r => r[0] === req.params.id);
    if (rowIndex === -1) return res.status(404).json({ message: 'Item not found' });
    const { title, category, photoUrl, description, status } = req.body;
    const updated = [req.params.id, title || '', category || '', photoUrl || '', description || '', status || 'active'];
    await updateRow(SHEET, rowIndex + 2, updated); // +2: 1 for header, 1 for 1-based index
    res.json({ message: 'Gallery item updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/gallery/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const rowIndex = rows.slice(1).findIndex(r => r[0] === req.params.id);
    if (rowIndex === -1) return res.status(404).json({ message: 'Item not found' });
    await deleteRow(SHEET, rowIndex + 2);
    res.json({ message: 'Gallery item deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
