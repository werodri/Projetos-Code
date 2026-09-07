import { createClient, type Client } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";

declare global {
  // eslint-disable-next-line no-var
  var __cartoesDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __cartoesDbReady: Promise<void> | undefined;
}

function resolveUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "cartoes.db")}`;
}

function createDb(): Client {
  return createClient({
    url: resolveUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function ensureSchema(db: Client) {
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_compras_cartao ON compras(cartao_id);`);
}

export async function getDb(): Promise<Client> {
  if (!globalThis.__cartoesDb) {
    globalThis.__cartoesDb = createDb();
  }
  if (!globalThis.__cartoesDbReady) {
    globalThis.__cartoesDbReady = ensureSchema(globalThis.__cartoesDb);
  }
  await globalThis.__cartoesDbReady;
  return globalThis.__cartoesDb;
}
