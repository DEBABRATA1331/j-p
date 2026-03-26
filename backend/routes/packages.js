/**
 * Packages Routes – CRUD via Google Sheets
 * Sheet name: "Packages"
 * Columns: A=id | B=name | C=price | D=icon | E=per | F=status | G=description | H=inclusions (JSON) | I=exclusions (JSON)
 */

const express = require('express');
const router = express.Router();
const { getSheetData, appendRow, updateRow, deleteRow } = require('../lib/sheets');
const { v4: uuidv4 } = require('uuid');

const SHEET = 'Packages';

function rowToObj(row) {
  return {
    id: row[0] || '',
    name: row[1] || '',
    price: row[2] || '',
    icon: row[3] || '',
    per: row[4] || '/ event',
    status: row[5] || 'active',
    description: row[6] || '',
    inclusions: safeParse(row[7], []),
    exclusions: safeParse(row[8], []),
  };
}

function safeParse(str, fallback) {
  try { return JSON.parse(str || '[]'); } catch { return fallback; }
}

// GET /api/packages
router.get('/', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    res.json(rows.slice(1).map(rowToObj));
  } catch (err) { next(err); }
});

// GET /api/packages/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const row = rows.slice(1).find(r => r[0] === req.params.id);
    if (!row) return res.status(404).json({ message: 'Package not found' });
    res.json(rowToObj(row));
  } catch (err) { next(err); }
});

// POST /api/packages
router.post('/', async (req, res, next) => {
  try {
    const { name, price, icon, per, status, description, inclusions, exclusions } = req.body;
    if (!name || !price) return res.status(400).json({ message: 'Name and price are required.' });
    const id = uuidv4();
    const newRow = [
      id, name, price, icon || '', per || '/ event', status || 'active',
      description || '', JSON.stringify(inclusions || []), JSON.stringify(exclusions || [])
    ];
    await appendRow(SHEET, newRow);
    res.status(201).json({ id, message: 'Package added.' });
  } catch (err) { next(err); }
});

// PUT /api/packages/:id
router.put('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const rowIndex = rows.slice(1).findIndex(r => r[0] === req.params.id);
    if (rowIndex === -1) return res.status(404).json({ message: 'Package not found' });
    const { name, price, icon, per, status, description, inclusions, exclusions } = req.body;
    const updated = [
      req.params.id, name || '', price || '', icon || '', per || '/ event',
      status || 'active', description || '',
      JSON.stringify(inclusions || []), JSON.stringify(exclusions || [])
    ];
    await updateRow(SHEET, rowIndex + 2, updated);
    res.json({ message: 'Package updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/packages/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const rows = await getSheetData(SHEET);
    const rowIndex = rows.slice(1).findIndex(r => r[0] === req.params.id);
    if (rowIndex === -1) return res.status(404).json({ message: 'Package not found' });
    await deleteRow(SHEET, rowIndex + 2);
    res.json({ message: 'Package deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
