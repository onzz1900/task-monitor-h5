import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("user:manage");
    const { id } = await ctx.params;
    const body = (await req.json()) as { role?: string };
    if (!body.role) throw new ApiError(400, "缺少 role");
    const role = db().prepare("SELECT code FROM roles WHERE code = ?").get(body.role);
    if (!role) throw new ApiError(400, "角色不存在");
    if (actor.id === id && body.role !== "admin") throw new ApiError(400, "不能移除自己的管理员角色");
    const info = db().prepare("UPDATE user SET role = ? WHERE id = ?").run(body.role, id);
    if (info.changes === 0) throw new ApiError(404, "用户不存在");
    const user = db()
      .prepare(
        `SELECT u.id, u.email, u.name, u.role AS role_code, r.name AS role_name
         FROM user u LEFT JOIN roles r ON r.code = u.role WHERE u.id = ?`
      )
      .get(id);
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}
