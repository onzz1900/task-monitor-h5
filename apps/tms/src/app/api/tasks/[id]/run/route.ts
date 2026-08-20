import { NextResponse } from "next/server";
import { handleApiError, requirePermission } from "@/lib/rbac";
import { runTask, serializeTask } from "@/lib/tasks";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("task:run");
    const { id } = await ctx.params;
    return NextResponse.json(await serializeTask(await runTask(Number(id)), true));
  } catch (err) {
    return handleApiError(err);
  }
}
