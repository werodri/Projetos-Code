import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cartoes.db");

declare global {
  // eslint-disable-next-line no-var
  var __cartoesDb: DatabaseSync | undefined;
}

function createDb(): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS cartoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      bandeira TEXT,
      final TEXT,
      limite REAL NOT NULL DEFAULT 0,
      dia_fechamento INTEGER NOT NULL,
      dia_vencimento INTEGER NOT NULL,
      cor TEXT NOT NULL DEFAULT '#6366f1',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cartao_id INTEGER NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
      descricao TEXT NOT NULL,
      categoria TEXT,
      valor_total REAL NOT NULL,
      parcelas INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL,
      fonte TEXT NOT NULL DEFAULT 'manual',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_compras_cartao ON compras(cartao_id);`
  );
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__cartoesDb) {
    globalThis.__cartoesDb = createDb();
  }
  return globalThis.__cartoesDb;
}
