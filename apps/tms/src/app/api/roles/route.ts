import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("role:read");
    const roles = db().prepare("SELECT id, code, name, description FROM roles ORDER BY id").all() as {
      id: number;
      code: string;
    }[];
    const permStmt = db().prepare(
      `SELECT p.code, p.name FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ? ORDER BY p.id`
    );
    return NextResponse.json(roles.map((r) => ({ ...r, permissions: permStmt.all(r.id) })));
  } catch (err) {
    return handleApiError(err);
  }
}
