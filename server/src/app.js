import express from 'express';
import cors from 'cors';
import { db, seedDatabase, transaction } from './database.js';

seedDatabase();
export const app = express();
app.use(cors());
app.use(express.json());

const id = () => crypto.randomUUID();
const cardFields = 'id, column_id AS columnId, title, description, label_color AS labelColor, due_date AS dueDate, position';

function boardWithContent(boardId) {
  const board = db.prepare('SELECT id, title FROM boards WHERE id = ?').get(boardId);
  if (!board) return null;
  const columns = db.prepare('SELECT id, board_id AS boardId, title, position FROM board_columns WHERE board_id = ? ORDER BY position').all(boardId);
  const cardsForColumn = db.prepare(`SELECT ${cardFields} FROM cards WHERE column_id = ? ORDER BY position`);
  return { ...board, columns: columns.map((column) => ({ ...column, cards: cardsForColumn.all(column.id) })) };
}

app.get('/api/boards', (_req, res) => res.json(db.prepare('SELECT id, title FROM boards ORDER BY created_at').all()));
app.get('/api/boards/:id', (req, res) => {
  const board = boardWithContent(req.params.id);
  if (!board) return res.status(404).json({ message: 'Tablero no encontrado.' });
  res.json(board);
});

app.post('/api/boards', (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ message: 'El título es obligatorio.' });
  const boardId = id();
  const create = () => transaction(() => {
    db.prepare('INSERT INTO boards (id, title) VALUES (?, ?)').run(boardId, title);
    const insert = db.prepare('INSERT INTO board_columns (id, board_id, title, position) VALUES (?, ?, ?, ?)');
    ['Por hacer', 'En progreso', 'Listo'].forEach((name, index) => insert.run(id(), boardId, name, (index + 1) * 1000));
  });
  create();
  res.status(201).json(boardWithContent(boardId));
});

app.post('/api/boards/:boardId/columns', (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ message: 'El nombre es obligatorio.' });
  const last = db.prepare('SELECT position FROM board_columns WHERE board_id = ? ORDER BY position DESC LIMIT 1').get(req.params.boardId);
  const column = { id: id(), boardId: req.params.boardId, title, position: (last?.position || 0) + 1000, cards: [] };
  db.prepare('INSERT INTO board_columns (id, board_id, title, position) VALUES (?, ?, ?, ?)').run(column.id, column.boardId, title, column.position);
  res.status(201).json(column);
});

app.patch('/api/columns/:id', (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ message: 'El nombre es obligatorio.' });
  const result = db.prepare('UPDATE board_columns SET title = ? WHERE id = ?').run(title, req.params.id);
  if (!result.changes) return res.status(404).json({ message: 'Columna no encontrada.' });
  res.json({ id: req.params.id, title });
});

app.post('/api/columns/:columnId/cards', (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ message: 'El título es obligatorio.' });
  const last = db.prepare('SELECT position FROM cards WHERE column_id = ? ORDER BY position DESC LIMIT 1').get(req.params.columnId);
  const card = { id: id(), columnId: req.params.columnId, title, description: '', labelColor: null, dueDate: null, position: (last?.position || 0) + 1000 };
  db.prepare('INSERT INTO cards (id, column_id, title, description, label_color, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(card.id, card.columnId, card.title, card.description, null, null, card.position);
  res.status(201).json(card);
});

app.patch('/api/cards/:id', (req, res) => {
  const current = db.prepare(`SELECT ${cardFields} FROM cards WHERE id = ?`).get(req.params.id);
  if (!current) return res.status(404).json({ message: 'Tarjeta no encontrada.' });
  const title = req.body.title?.trim() || current.title;
  const description = typeof req.body.description === 'string' ? req.body.description : current.description;
  const labelColor = req.body.labelColor === undefined ? current.labelColor : req.body.labelColor;
  const dueDate = req.body.dueDate === undefined ? current.dueDate : req.body.dueDate;
  db.prepare('UPDATE cards SET title = ?, description = ?, label_color = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title, description, labelColor, dueDate, req.params.id);
  res.json({ ...current, title, description, labelColor, dueDate });
});

app.delete('/api/cards/:id', (req, res) => {
  const result = db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ message: 'Tarjeta no encontrada.' });
  res.status(204).end();
});

app.patch('/api/cards/:id/move', (req, res) => {
  const { columnId, beforeId, afterId } = req.body;
  const card = db.prepare('SELECT id FROM cards WHERE id = ?').get(req.params.id);
  const column = db.prepare('SELECT id FROM board_columns WHERE id = ?').get(columnId);
  if (!card || !column) return res.status(404).json({ message: 'Tarjeta o columna no encontrada.' });

  const before = beforeId ? db.prepare('SELECT position FROM cards WHERE id = ? AND column_id = ?').get(beforeId, columnId) : null;
  const after = afterId ? db.prepare('SELECT position FROM cards WHERE id = ? AND column_id = ?').get(afterId, columnId) : null;
  let position = before && after ? Math.floor((before.position + after.position) / 2) : before ? before.position + 1000 : after ? after.position - 1000 : 1000;

  const move = () => transaction(() => {
    if (before && after && position === before.position) {
      const cards = db.prepare('SELECT id FROM cards WHERE column_id = ? AND id != ? ORDER BY position').all(columnId, req.params.id);
      const update = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
      cards.forEach((item, index) => update.run((index + 1) * 1000, item.id));
      const refreshedBefore = db.prepare('SELECT position FROM cards WHERE id = ?').get(beforeId);
      const refreshedAfter = db.prepare('SELECT position FROM cards WHERE id = ?').get(afterId);
      position = Math.floor((refreshedBefore.position + refreshedAfter.position) / 2);
    }
    db.prepare('UPDATE cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(columnId, position, req.params.id);
  });
  move();
  res.json({ id: req.params.id, columnId, position });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Ocurrió un error inesperado.' });
});
