import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ detail: "未登录" }, { status: 401 });
  const menus = (
    db().prepare("SELECT title, path, sort, permission_code FROM menus ORDER BY sort").all() as {
      title: string;
      path: string;
      sort: number;
      permission_code: string;
    }[]
  ).filter((m) => user.permissions.includes(m.permission_code));
  const roleName = (
    db().prepare("SELECT name FROM roles WHERE code = ?").get(user.role) as { name: string } | undefined
  )?.name;
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, role_name: roleName ?? user.role },
    permissions: user.permissions,
    menus,
  });
}
