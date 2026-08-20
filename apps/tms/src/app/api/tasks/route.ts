import { NextResponse } from "next/server";

import { execute, query, queryOne } from "@/lib/db";
import { handleApiError, requirePermission } from "@/lib/rbac";
import { computeNextRun } from "@/lib/schedule";
import { nextTaskCode, normalizeInput, serializeTask, type TaskRow } from "@/lib/tasks";

export async function GET() {
  try {
    await requirePermission("task:read");
    const rows = await query<TaskRow>("SELECT * FROM tasks ORDER BY (next_run_at IS NULL), next_run_at");
    return NextResponse.json(await Promise.all(rows.map((r) => serializeTask(r))));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("task:create");
    const t = await normalizeInput(await req.json());
    const now = new Date().toISOString();
    const nextRun = computeNextRun(t.schedule_kind!, t.cron_expr ?? null, t.interval_minutes ?? null);
    const info = await execute(
      `INSERT INTO tasks (
         code, title, description, type, status, owner_name, channel,
         points_done, points_total, points_note,
         schedule_kind, cron_expr, interval_minutes, next_run_at,
         callback_url, callback_timeout_ms, callback_retries, callback_secret_ref,
         keep_runs, target_kind, target_code, multi_shop, remark,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        await nextTaskCode(),
        t.title,
        t.description,
        t.type,
        t.status,
        t.owner_name,
        t.channel,
        t.points_done,
        t.points_total,
        t.points_note,
        t.schedule_kind,
        t.cron_expr,
        t.interval_minutes,
        nextRun,
        t.callback_url,
        t.callback_timeout_ms,
        t.callback_retries,
        t.callback_secret_ref,
        t.keep_runs,
        t.target_kind,
        t.target_code,
        t.multi_shop ? 1 : 0,
        t.remark,
        now,
        now,
      ],
    );
    const row = await queryOne<TaskRow>("SELECT * FROM tasks WHERE id = ?", [info.insertId]);
    return NextResponse.json(await serializeTask(row as TaskRow, true), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
