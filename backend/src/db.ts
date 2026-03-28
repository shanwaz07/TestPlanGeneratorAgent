import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../data/app.db');
let db: Database;

export async function initDb(): Promise<void> {
  const SQL: SqlJsStatic = await initSqlJs();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      extracted_text TEXT,
      sections TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_default INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS test_plans (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      ticket_summary TEXT,
      template_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS recent_tickets (
      ticket_id TEXT PRIMARY KEY,
      summary TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  persist();
}

export function persist(): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function dbGet<T>(sql: string, params: (string | number | null)[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = stmt.step() ? (stmt.getAsObject() as unknown as T) : null;
  stmt.free();
  return result;
}

export function dbAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function dbRun(sql: string, params: (string | number | null)[] = []): void {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  persist();
}
