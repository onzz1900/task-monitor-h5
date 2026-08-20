/**
 * MySQL 连接池（系统记录源）。连接串来自 DATABASE_URL（mysql://...）。
 */
import mysql from "mysql2/promise";

import { RUOYI_DDL } from "./ruoyi-schema";

const DEFAULT_DATABASE_URL = "mysql://tms:tmsdemo@127.0.0.1:3306/tms";

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  if (!url.startsWith("mysql://") && !url.startsWith("mysql2://")) {
    throw new Error("DATABASE_URL must be a mysql:// connection string");
  }
  return url.replace(/^mysql2:/, "mysql:");
}

let _pool: mysql.Pool | null = null;

export function pool(): mysql.Pool {
  if (_pool) return _pool;
  _pool = mysql.createPool({
    uri: getDatabaseUrl(),
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
  });
  return _pool;
}

type SqlValue = string | number | boolean | Date | Buffer | null | undefined | unknown;

function bind(params: SqlValue[]): (string | number | boolean | Date | Buffer | null)[] {
  return params.map((value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (value instanceof Date || Buffer.isBuffer(value)) return value;
    return String(value);
  });
}

export async function query<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  const [rows] = await pool().execute(sql, bind(params));
  return rows as T[];
}

export async function queryOne<T>(sql: string, params: SqlValue[] = []): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function execute(sql: string, params: SqlValue[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await pool().execute(sql, bind(params));
  return result as mysql.ResultSetHeader;
}

export async function exec(sql: string): Promise<void> {
  await pool().query(sql);
}

export async function waitForMysql(attempts = 40, delayMs = 500): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await pool().query("SELECT 1");
      return;
    } catch (err) {
      last = err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw last instanceof Error ? last : new Error("MySQL is not reachable");
}

export function asCount(n: unknown): number {
  return Number(n ?? 0);
}

/**
 * mysql2 `execute` (binary prepared statements) rejects bound LIMIT/OFFSET on
 * MySQL 8.x (`Incorrect arguments to mysqld_stmt_execute`). Inline a clamped int.
 */
export function sqlLimit(value: unknown, fallback = 1, max = 1000): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, n);
}

export async function createDomainTables(): Promise<void> {
  await exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(128) NOT NULL,
      description VARCHAR(512) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS permissions (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(128) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS menus (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(128) NOT NULL,
      path VARCHAR(255) NOT NULL,
      sort INT NOT NULL DEFAULT 0,
      permission_code VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS tasks (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(32) NOT NULL DEFAULT 'review',
      status VARCHAR(32) NOT NULL DEFAULT '待流转',
      owner_name VARCHAR(128) NOT NULL DEFAULT '',
      channel VARCHAR(255) NOT NULL DEFAULT '',
      points_done INT NOT NULL DEFAULT 0,
      points_total INT NOT NULL DEFAULT 1,
      points_note VARCHAR(512) NOT NULL DEFAULT '',
      schedule_kind VARCHAR(16) NOT NULL DEFAULT 'cron',
      cron_expr VARCHAR(64) NULL,
      interval_minutes INT NULL,
      timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
      next_run_at VARCHAR(64) NULL,
      callback_url VARCHAR(512) NULL,
      callback_timeout_ms INT NOT NULL DEFAULT 10000,
      callback_retries INT NOT NULL DEFAULT 3,
      callback_secret_ref VARCHAR(128) NULL,
      keep_runs INT NOT NULL DEFAULT 10,
      target_kind VARCHAR(32) NOT NULL DEFAULT 'other',
      target_code VARCHAR(64) NOT NULL DEFAULT '',
      multi_shop TINYINT NOT NULL DEFAULT 0,
      remark VARCHAR(1024) NOT NULL DEFAULT '',
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS task_runs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      ran_at VARCHAR(64) NOT NULL,
      ok TINYINT NOT NULL DEFAULT 1,
      result_text TEXT NOT NULL,
      duration_ms INT NOT NULL DEFAULT 0,
      CONSTRAINT fk_runs_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      INDEX idx_task_runs_task (task_id, ran_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await exec(RUOYI_DDL);
}
