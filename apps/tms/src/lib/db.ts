/**
 * SQLite 数据库（系统记录源）。
 * 表结构只用 INTEGER/TEXT 等可平移类型，后续可迁移到 Postgres。
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_FILE = process.env.TMS_DB_FILE ?? path.join(DATA_DIR, "tms.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_FILE);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  return _db;
}

export function createDomainTables(): void {
  db().exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      permission_code TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'review',
      status TEXT NOT NULL DEFAULT '待流转',
      owner_name TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL DEFAULT '',
      points_done INTEGER NOT NULL DEFAULT 0,
      points_total INTEGER NOT NULL DEFAULT 1,
      points_note TEXT NOT NULL DEFAULT '',
      schedule_kind TEXT NOT NULL DEFAULT 'cron',
      cron_expr TEXT,
      interval_minutes INTEGER,
      timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
      next_run_at TEXT,
      callback_url TEXT,
      callback_timeout_ms INTEGER NOT NULL DEFAULT 10000,
      callback_retries INTEGER NOT NULL DEFAULT 3,
      callback_secret_ref TEXT,
      keep_runs INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      ran_at TEXT NOT NULL,
      ok INTEGER NOT NULL DEFAULT 1,
      result_text TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_task_runs_task ON task_runs(task_id, ran_at DESC);
  `);
}
