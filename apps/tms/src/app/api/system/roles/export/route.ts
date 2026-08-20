import { NextResponse } from "next/server";

import { handleApiError, requirePermission } from "@/lib/rbac";
import { listRoles } from "@/lib/ruoyi";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET() {
  try {
    await requirePermission("system:role:export");
    const roles = await listRoles();
    const lines = [
      "role_name,role_key,role_sort,status,remark",
      ...roles.map((r) => [r.role_name, r.role_key, r.role_sort, r.status, r.remark].map(csvCell).join(",")),
    ];
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sys_role.csv"',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
