import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.DATABASE_URL || path.join(currentDir, '../data/kanban.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON');

export function transaction(work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS board_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    label_color TEXT,
    due_date TEXT,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_columns_board_position ON board_columns(board_id, position);
  CREATE INDEX IF NOT EXISTS idx_cards_column_position ON cards(column_id, position);
`);

const id = () => crypto.randomUUID();

export function seedDatabase() {
  if (db.prepare('SELECT id FROM boards LIMIT 1').get()) return;
  const boardId = id();
  const columns = [
    ['Por hacer', 1000],
    ['En progreso', 2000],
    ['Listo', 3000]
  ].map(([title, position]) => ({ id: id(), title, position }));

  const create = () => transaction(() => {
    db.prepare('INSERT INTO boards (id, title) VALUES (?, ?)').run(boardId, 'Mi tablero');
    const insertColumn = db.prepare('INSERT INTO board_columns (id, board_id, title, position) VALUES (?, ?, ?, ?)');
    columns.forEach((column) => insertColumn.run(column.id, boardId, column.title, column.position));
    db.prepare('INSERT INTO cards (id, column_id, title, description, label_color, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id(), columns[0].id, 'Diseñar la portada', 'Crear una primera versión del tablero.', '#8b5cf6', null, 1000);
    db.prepare('INSERT INTO cards (id, column_id, title, description, label_color, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id(), columns[1].id, 'Construir el MVP', 'Implementar el flujo principal.', '#38bdf8', null, 1000);
  });
  create();
}
