import { NextResponse } from "next/server";

import { handleApiError, requirePermission } from "@/lib/rbac";
import { listRoles, menuIdsForRole, serializeRole } from "@/lib/ruoyi";

export async function GET() {
  try {
    await requirePermission("system:role:list");
    const roles = await listRoles();
    const result = [];
    for (const role of roles) {
      result.push(serializeRole(role, await menuIdsForRole(Number(role.role_id))));
    }
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
