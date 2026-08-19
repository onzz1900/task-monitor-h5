/**
 * 首次启动初始化：Better Auth 建表 → 业务建表 → 写入演示数据。
 * 每个 Route Handler 入口 await ensureReady() 即可，幂等且只执行一次。
 */
import { getMigrations } from "better-auth/db/migration";
import { auth } from "./auth";
import { createDomainTables, db } from "./db";
import { computeNextRun } from "./schedule";

const PERMISSIONS: [string, string][] = [
  ["task:read", "查看任务"],
  ["task:create", "登记任务"],
  ["task:update", "修改任务"],
  ["task:run", "运行任务"],
  ["user:read", "查看用户"],
  ["user:manage", "管理用户"],
  ["role:read", "查看角色权限"],
];

const ROLES: [string, string, string, string[]][] = [
  ["admin", "管理员", "全部权限", PERMISSIONS.map((p) => p[0])],
  ["duty", "值班", "任务的登记、修改与运行", ["task:read", "task:create", "task:update", "task:run"]],
  ["readonly", "只读", "仅可查看任务", ["task:read"]],
];

const MENUS: [string, string, number, string][] = [
  ["任务管理", "/tasks", 1, "task:read"],
  ["用户管理", "/users", 2, "user:read"],
  ["角色权限", "/roles", 3, "role:read"],
];

const USERS: [string, string, string, string][] = [
  ["admin@tms.local", "admin123", "周琪", "admin"],
  ["duty@tms.local", "duty123", "韩澄", "duty"],
  ["readonly@tms.local", "read123", "苏晚", "readonly"],
];

type SeedRun = { ok: number; text: string; duration: number; minutesAgo: number };

const TASKS: (Record<string, unknown> & { run: SeedRun })[] = [
  {
    code: "FL-3017",
    title: "聊天记录采集",
    description: "拉取天猫 / 京东旗舰店客服会话并入库。",
    type: "chat",
    status: "运行中",
    owner_name: "韩澄",
    channel: "天猫 + 京东",
    points_done: 12,
    points_total: 20,
    points_note: "20 个店铺点位：华东 12 店已完成，华南 8 店排队中。",
    schedule_kind: "cron",
    cron_expr: "30 8-20/2 * * *",
    callback_url: "https://hooks.example.com/tms/chat",
    callback_secret_ref: "ops-callback-key",
    run: { ok: 1, text: "成功 · 采集 1,368 条会话", duration: 42000, minutesAgo: 25 },
  },
  {
    code: "FL-3021",
    title: "旗舰店评价采集",
    description: "回写近 24 小时新增评价。",
    type: "review",
    status: "运行中",
    owner_name: "林晓禾",
    channel: "天猫旗舰",
    points_done: 9,
    points_total: 14,
    points_note: "14 个旗舰店点位，已采 9 店。",
    schedule_kind: "interval",
    interval_minutes: 180,
    run: { ok: 1, text: "成功 · 入库 1,052 条评价", duration: 55000, minutesAgo: 48 },
  },
  {
    code: "FL-3025",
    title: "店铺转化率监控",
    description: "核对主搜与购物车漏斗数据。",
    type: "conv",
    status: "运行中",
    owner_name: "王倩",
    channel: "全渠道漏斗",
    points_done: 16,
    points_total: 18,
    points_note: "18 个漏斗监控点位，剩 2 个直播间未出数。",
    schedule_kind: "cron",
    cron_expr: "*/40 9-22 * * *",
    run: { ok: 1, text: "成功 · 全站转化率 3.4%", duration: 21000, minutesAgo: 15 },
  },
  {
    code: "FL-3008",
    title: "商详绘图记录采集",
    description: "采集主图与商详设计稿回传记录。",
    type: "draw",
    status: "待流转",
    owner_name: "沈见远",
    channel: "主图 / 商详",
    points_done: 7,
    points_total: 10,
    points_note: "10 个商详绘图点位，7 店已回传。",
    schedule_kind: "cron",
    cron_expr: "0 14 * * *",
    run: { ok: 1, text: "成功 · 回传 7 店设计稿", duration: 63000, minutesAgo: 115 },
  },
  {
    code: "FL-2996",
    title: "实时成交数据监控",
    description: "成交看板数据核对与告警。",
    type: "monitor",
    status: "已阻塞",
    owner_name: "赵启明",
    channel: "成交看板",
    points_done: 5,
    points_total: 16,
    points_note: "16 个成交监控点位，京东侧全部超时。",
    schedule_kind: "interval",
    interval_minutes: 30,
    callback_url: "https://hooks.example.com/tms/monitor",
    callback_secret_ref: "jd-open-api",
    run: { ok: 0, text: "失败 · 京东订单接口超时（11 个点位无数据）", duration: 30000, minutesAgo: 33 },
  },
  {
    code: "FL-3030",
    title: "日报报表任务",
    description: "华东 / 华南 / 全国三张日报。",
    type: "report",
    status: "待流转",
    owner_name: "苏晚",
    channel: "华东 / 华南 / 全国",
    points_done: 1,
    points_total: 3,
    points_note: "华东已出，华南与全国待流转。",
    schedule_kind: "cron",
    cron_expr: "0 16 * * *",
    run: { ok: 1, text: "成功 · 已出华东日报", duration: 18000, minutesAgo: 95 },
  },
];

function seedDomain(): void {
  const d = db();
  const now = new Date().toISOString();

  const permStmt = d.prepare("INSERT INTO permissions (code, name) VALUES (?, ?)");
  for (const [code, name] of PERMISSIONS) permStmt.run(code, name);

  const roleStmt = d.prepare("INSERT INTO roles (code, name, description) VALUES (?, ?, ?)");
  const rpStmt = d.prepare(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = ? AND p.code = ?`
  );
  for (const [code, name, desc, permCodes] of ROLES) {
    roleStmt.run(code, name, desc);
    for (const pc of permCodes) rpStmt.run(code, pc);
  }

  const menuStmt = d.prepare(
    "INSERT INTO menus (title, path, sort, permission_code) VALUES (?, ?, ?, ?)"
  );
  for (const [title, path, sort, perm] of MENUS) menuStmt.run(title, path, sort, perm);

  const taskCols = [
    "code", "title", "description", "type", "status", "owner_name", "channel",
    "points_done", "points_total", "points_note", "schedule_kind", "cron_expr",
    "interval_minutes", "callback_url", "callback_secret_ref", "next_run_at",
    "created_at", "updated_at",
  ];
  const taskStmt = d.prepare(
    `INSERT INTO tasks (${taskCols.join(", ")}) VALUES (${taskCols.map(() => "?").join(", ")})`
  );
  const runStmt = d.prepare(
    "INSERT INTO task_runs (task_id, ran_at, ok, result_text, duration_ms) VALUES (?, ?, ?, ?, ?)"
  );

  for (const spec of TASKS) {
    const { run, ...t } = spec;
    const nextRun = computeNextRun(
      t.schedule_kind as string,
      (t.cron_expr as string) ?? null,
      (t.interval_minutes as number) ?? null
    );
    const info = taskStmt.run(
      t.code, t.title, t.description ?? "", t.type, t.status, t.owner_name ?? "",
      t.channel ?? "", t.points_done ?? 0, t.points_total ?? 1, t.points_note ?? "",
      t.schedule_kind, t.cron_expr ?? null, t.interval_minutes ?? null,
      t.callback_url ?? null, t.callback_secret_ref ?? null, nextRun, now, now
    );
    runStmt.run(
      info.lastInsertRowid,
      new Date(Date.now() - run.minutesAgo * 60_000).toISOString(),
      run.ok,
      run.text,
      run.duration
    );
  }
}

async function seedUsers(): Promise<void> {
  const d = db();
  for (const [email, password, name, role] of USERS) {
    // 注册流程（含密码哈希）交给 Better Auth；role 字段注册后由服务端直接落库
    await auth.api.signUpEmail({ body: { email, password, name } });
    d.prepare("UPDATE user SET role = ? WHERE email = ?").run(role, email);
  }
}

let readyPromise: Promise<void> | null = null;

export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      createDomainTables();
      const seeded = db()
        .prepare("SELECT COUNT(*) AS n FROM roles")
        .get() as { n: number };
      if (seeded.n === 0) {
        seedDomain();
        await seedUsers();
      }
    })().catch((err) => {
      readyPromise = null; // 失败不缓存，允许下次请求重试
      throw err;
    });
  }
  return readyPromise;
}
