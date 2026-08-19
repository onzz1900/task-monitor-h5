import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("user:read");
    const users = db()
      .prepare(
        `SELECT u.id, u.email, u.name, u.role AS role_code, r.name AS role_name
         FROM user u LEFT JOIN roles r ON r.code = u.role
         ORDER BY u.email`
      )
      .all();
    return NextResponse.json(users);
  } catch (err) {
    return handleApiError(err);
  }
}
