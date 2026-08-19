/** 任务领域逻辑：校验、序列化、模拟运行、备份裁剪。 */
import { asCount, execute, query, queryOne } from "./db";
import { SECRET_REFS, STATUSES, TASK_TYPES } from "./meta";
import { computeNextRun, isValidCron } from "./schedule";
import { ApiError } from "./rbac";

export type TaskInput = {
  title: string;
  description?: string;
  type?: string;
  owner_name?: string;
  channel?: string;
  points_done?: number;
  points_total?: number;
  points_note?: string;
  schedule_kind?: string;
  cron_expr?: string | null;
  interval_minutes?: number | null;
  callback_url?: string | null;
  callback_timeout_ms?: number;
  callback_retries?: number;
  callback_secret_ref?: string | null;
  keep_runs?: number;
  status?: string;
};

export type TaskRow = Record<string, unknown> & { id: number };

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export function normalizeInput(body: TaskInput): TaskInput {
  const t: TaskInput = {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? ""),
    type: String(body.type ?? "review"),
    owner_name: String(body.owner_name ?? ""),
    channel: String(body.channel ?? ""),
    points_done: num(body.points_done, 0),
    points_total: num(body.points_total, 1),
    points_note: String(body.points_note ?? ""),
    schedule_kind: String(body.schedule_kind ?? "cron"),
    cron_expr: body.cron_expr ? String(body.cron_expr).trim() : null,
    interval_minutes: body.interval_minutes ? num(body.interval_minutes, 0) : null,
    callback_url: body.callback_url ? String(body.callback_url).trim() : null,
    callback_timeout_ms: num(body.callback_timeout_ms, 5000),
    callback_retries: num(body.callback_retries, 3),
    callback_secret_ref: body.callback_secret_ref ? String(body.callback_secret_ref) : null,
    keep_runs: num(body.keep_runs, 10),
    status: body.status ? String(body.status) : undefined,
  };

  if (!t.title) throw new ApiError(400, "请填写任务名称");
  if (!(t.type! in TASK_TYPES)) throw new ApiError(400, "任务类型无效");
  if (t.schedule_kind === "cron") {
    if (!t.cron_expr || !isValidCron(t.cron_expr)) throw new ApiError(400, "cron 表达式无效");
  } else if (t.schedule_kind === "interval") {
    if (!t.interval_minutes || t.interval_minutes < 1) throw new ApiError(400, "请填写间隔分钟数");
  } else {
    throw new ApiError(400, "调度方式只能是 cron 或 interval");
  }
  if (t.callback_url && !/^https?:\/\//.test(t.callback_url)) {
    throw new ApiError(400, "回调地址必须是 http(s) URL");
  }
  if (t.callback_secret_ref && !SECRET_REFS.some((s) => s.ref === t.callback_secret_ref)) {
    throw new ApiError(400, "secretRef 不存在");
  }
  if (t.callback_timeout_ms! < 100 || t.callback_timeout_ms! > 120000) {
    throw new ApiError(400, "回调超时需在 100–120000 毫秒之间");
  }
  if (t.callback_retries! < 0 || t.callback_retries! > 10) throw new ApiError(400, "重试次数需在 0–10 之间");
  if (t.keep_runs! < 1 || t.keep_runs! > 100) throw new ApiError(400, "备份份数需在 1–100 之间");
  if (t.points_total! < 1) throw new ApiError(400, "总点位至少为 1");
  if (t.points_done! < 0 || t.points_done! > t.points_total!) {
    throw new ApiError(400, "已完成点位需在 0 与总点位之间");
  }
  if (t.status && !STATUSES.includes(t.status as (typeof STATUSES)[number])) {
    throw new ApiError(400, "状态无效");
  }
  return t;
}

export async function serializeTask(row: TaskRow, withRuns = false) {
  const runs = await query<Record<string, unknown>>(
    "SELECT id, ran_at, ok, result_text, duration_ms FROM task_runs WHERE task_id = ? ORDER BY ran_at DESC LIMIT ?",
    [row.id, withRuns ? 100 : 1],
  );
  const toRun = (r: Record<string, unknown>) => ({ ...r, ok: Boolean(r.ok) });
  return {
    ...row,
    last_run: runs.length ? toRun(runs[0]) : null,
    ...(withRuns ? { runs: runs.map(toRun) } : {}),
  };
}

export async function getTask(id: number): Promise<TaskRow> {
  const row = await queryOne<TaskRow>("SELECT * FROM tasks WHERE id = ?", [id]);
  if (!row) throw new ApiError(404, "任务不存在");
  return row;
}

export async function nextTaskCode(): Promise<string> {
  const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM tasks");
  return `FL-${3100 + asCount(row?.n)}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function mockRunResult(task: TaskRow): { ok: boolean; text: string } {
  const total = task.points_total as number;
  if (Math.random() < 0.2) {
    const fails = [
      `失败 · 接口超时（${randInt(2, Math.max(2, total))} 个点位无数据）`,
      "失败 · 回调网关返回 502",
      "失败 · 触发反爬限流，等待冷却窗口",
    ];
    return { ok: false, text: fails[randInt(0, fails.length - 1)] };
  }
  const n = randInt(300, 2000).toLocaleString("en-US");
  const texts: Record<string, string> = {
    review: `成功 · 入库 ${n} 条评价`,
    chat: `成功 · 采集 ${n} 条会话`,
    draw: `成功 · 回传 ${randInt(1, total)} 店设计稿`,
    conv: `成功 · 全站转化率 ${(2.8 + Math.random() * 1.4).toFixed(1)}%`,
    monitor: `成功 · 巡查 ${total} 个点位，无告警`,
    report: `成功 · 已出 ${randInt(1, total)} 份报表`,
  };
  return { ok: true, text: texts[task.type as string] ?? `成功 · 处理 ${n} 条记录` };
}

/** 运行一次（模拟结果入库），并把备份裁剪到最近 keep_runs 次。 */
export async function runTask(id: number): Promise<TaskRow> {
  const task = await getTask(id);
  const now = new Date();
  const { ok, text } = mockRunResult(task);

  await execute(
    "INSERT INTO task_runs (task_id, ran_at, ok, result_text, duration_ms) VALUES (?, ?, ?, ?, ?)",
    [id, now.toISOString(), ok ? 1 : 0, text, randInt(5000, 90000)],
  );

  let pointsDone = task.points_done as number;
  const total = task.points_total as number;
  let status: string;
  if (ok) {
    if (pointsDone < total) pointsDone = Math.min(total, pointsDone + randInt(1, 3));
    status = pointsDone >= total ? "本轮已完成" : "运行中";
  } else {
    status = "已阻塞";
  }
  const nextRun = computeNextRun(
    task.schedule_kind as string,
    task.cron_expr as string | null,
    task.interval_minutes as number | null,
    now,
  );
  await execute("UPDATE tasks SET points_done = ?, status = ?, next_run_at = ?, updated_at = ? WHERE id = ?", [
    pointsDone,
    status,
    nextRun,
    now.toISOString(),
    id,
  ]);

  await execute(
    `DELETE FROM task_runs WHERE task_id = ? AND id NOT IN (
       SELECT id FROM (
         SELECT id FROM task_runs WHERE task_id = ? ORDER BY ran_at DESC LIMIT ?
       ) kept
     )`,
    [id, id, task.keep_runs as number],
  );

  return getTask(id);
}
