import { NextResponse } from "next/server";
import { SECRET_REFS, STATUSES, TASK_TYPES } from "@/lib/meta";
import { handleApiError, requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("task:read");
    return NextResponse.json({ task_types: TASK_TYPES, statuses: STATUSES, secret_refs: SECRET_REFS });
  } catch (err) {
    return handleApiError(err);
  }
}
