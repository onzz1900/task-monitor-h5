import { NextResponse } from "next/server";

import { handleApiError, requirePermission } from "@/lib/rbac";
import { listDepts } from "@/lib/ruoyi";

export async function GET() {
  try {
    await requirePermission("system:user:list");
    return NextResponse.json(await listDepts());
  } catch (err) {
    return handleApiError(err);
  }
}
