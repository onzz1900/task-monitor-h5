import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { handleApiError, requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("role:read");
    const roles = await query<{ id: number; code: string }>(
      "SELECT id, code, name, description FROM roles ORDER BY id",
    );
    const result = [];
    for (const role of roles) {
      const permissions = await query(
        `SELECT p.code, p.name FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ? ORDER BY p.id`,
        [role.id],
      );
      result.push({ ...role, permissions });
    }
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
