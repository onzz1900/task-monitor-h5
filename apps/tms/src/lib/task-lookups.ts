/** Platform / business-system lookups. Seeded into MySQL; pages read via /api/meta. */
import { asCount, exec, execute, query, queryOne } from "./db";

export const TARGET_KINDS = {
  platform: "平台",
  business: "业务系统",
  other: "其他",
} as const;

export type TargetKind = keyof typeof TARGET_KINDS;

export const LOOKUP_SEED: { kind: "platform" | "business"; code: string; label: string; sort: number }[] = [
  { kind: "platform", code: "taobao", label: "淘宝", sort: 1 },
  { kind: "platform", code: "jd", label: "京东", sort: 2 },
  { kind: "platform", code: "pdd", label: "拼多多", sort: 3 },
  { kind: "platform", code: "douyin", label: "抖音", sort: 4 },
  { kind: "platform", code: "xhs", label: "小红书", sort: 5 },
  { kind: "platform", code: "tmall", label: "天猫", sort: 6 },
  { kind: "business", code: "oms", label: "OMS", sort: 1 },
  { kind: "business", code: "erp", label: "ERP", sort: 2 },
  { kind: "business", code: "wms", label: "WMS", sort: 3 },
  { kind: "business", code: "ticket", label: "客服工单", sort: 4 },
  { kind: "business", code: "zixuntong", label: "资讯通", sort: 5 },
];

export type LookupRow = { kind: string; code: string; label: string; sort: number };

const TASK_CAPTAIN_COLUMNS: { name: string; ddl: string }[] = [
  { name: "target_kind", ddl: "ALTER TABLE tasks ADD COLUMN target_kind VARCHAR(32) NOT NULL DEFAULT 'other'" },
  { name: "target_code", ddl: "ALTER TABLE tasks ADD COLUMN target_code VARCHAR(64) NOT NULL DEFAULT ''" },
  { name: "multi_shop", ddl: "ALTER TABLE tasks ADD COLUMN multi_shop TINYINT NOT NULL DEFAULT 0" },
  { name: "remark", ddl: "ALTER TABLE tasks ADD COLUMN remark VARCHAR(1024) NOT NULL DEFAULT ''" },
];

async function hasColumn(table: string, column: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return asCount(row?.n) > 0;
}

export async function ensureTaskCaptainSchema(): Promise<void> {
  for (const col of TASK_CAPTAIN_COLUMNS) {
    if (!(await hasColumn("tasks", col.name))) {
      await exec(col.ddl);
    }
  }
  await exec(`
    CREATE TABLE IF NOT EXISTS task_lookups (
      kind VARCHAR(32) NOT NULL,
      code VARCHAR(64) NOT NULL,
      label VARCHAR(128) NOT NULL,
      sort INT NOT NULL DEFAULT 0,
      PRIMARY KEY (kind, code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  for (const row of LOOKUP_SEED) {
    await execute("INSERT IGNORE INTO task_lookups (kind, code, label, sort) VALUES (?, ?, ?, ?)", [
      row.kind,
      row.code,
      row.label,
      row.sort,
    ]);
  }
}

export async function listLookups(kind?: string): Promise<LookupRow[]> {
  if (kind) {
    return query<LookupRow>("SELECT kind, code, label, sort FROM task_lookups WHERE kind = ? ORDER BY sort, code", [
      kind,
    ]);
  }
  return query<LookupRow>("SELECT kind, code, label, sort FROM task_lookups ORDER BY kind, sort, code");
}

export function isTargetKind(value: string): value is TargetKind {
  return value === "platform" || value === "business" || value === "other";
}
