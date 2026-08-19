import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { handleApiError, requirePermission } from "@/lib/rbac";
import { computeNextRun } from "@/lib/schedule";
import { getTask, normalizeInput, serializeTask } from "@/lib/tasks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requirePermission("task:read");
    const { id } = await ctx.params;
    return NextResponse.json(await serializeTask(await getTask(Number(id)), true));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requirePermission("task:update");
    const { id } = await ctx.params;
    const task = await getTask(Number(id));
    const t = normalizeInput(await req.json());
    const nextRun = computeNextRun(t.schedule_kind!, t.cron_expr ?? null, t.interval_minutes ?? null);
    await execute(
      `UPDATE tasks SET
         title = ?, description = ?, type = ?, owner_name = ?, channel = ?,
         points_done = ?, points_total = ?, points_note = ?,
         schedule_kind = ?, cron_expr = ?, interval_minutes = ?, next_run_at = ?,
         callback_url = ?, callback_timeout_ms = ?, callback_retries = ?, callback_secret_ref = ?,
         keep_runs = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        t.title,
        t.description,
        t.type,
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
        t.status ?? (task.status as string),
        new Date().toISOString(),
        task.id,
      ],
    );
    return NextResponse.json(await serializeTask(await getTask(task.id), true));
  } catch (err) {
    return handleApiError(err);
  }
}
