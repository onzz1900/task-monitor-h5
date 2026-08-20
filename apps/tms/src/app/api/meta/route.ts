import { NextResponse } from "next/server";

import { SECRET_REFS, STATUSES, TASK_TYPES } from "@/lib/meta";
import { handleApiError, requirePermission } from "@/lib/rbac";
import { listLookups, TARGET_KINDS } from "@/lib/task-lookups";

export async function GET() {
  try {
    await requirePermission("task:read");
    const lookups = await listLookups();
    return NextResponse.json({
      task_types: TASK_TYPES,
      statuses: STATUSES,
      secret_refs: SECRET_REFS,
      target_kinds: TARGET_KINDS,
      platforms: lookups.filter((row) => row.kind === "platform"),
      business_systems: lookups.filter((row) => row.kind === "business"),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
