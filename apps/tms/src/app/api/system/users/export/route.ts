import { NextResponse } from "next/server";

import { handleApiError, requirePermission } from "@/lib/rbac";
import { listUsers } from "@/lib/ruoyi";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET() {
  try {
    await requirePermission("system:user:export");
    const users = await listUsers();
    const header = ["user_name", "nick_name", "email", "phonenumber", "sex", "status", "dept_name", "remark"];
    const lines = [
      header.join(","),
      ...users.map((u) =>
        [u.user_name, u.nick_name, u.email, u.phonenumber, u.sex, u.status, u.dept_name, u.remark]
          .map(csvCell)
          .join(","),
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sys_user.csv"',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
