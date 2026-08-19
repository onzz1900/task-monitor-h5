import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("user:manage");
    const { id } = await ctx.params;
    const body = (await req.json()) as { role?: string };
    if (!body.role) throw new ApiError(400, "缺少 role");
    const role = await queryOne<{ code: string }>("SELECT code FROM roles WHERE code = ?", [body.role]);
    if (!role) throw new ApiError(400, "角色不存在");
    if (actor.id === id && body.role !== "admin") throw new ApiError(400, "不能移除自己的管理员角色");
    const info = await execute("UPDATE `user` SET role = ? WHERE id = ?", [body.role, id]);
    if (info.affectedRows === 0) throw new ApiError(404, "用户不存在");
    const user = await queryOne(
      `SELECT u.id, u.email, u.name, u.role AS role_code, r.name AS role_name
       FROM \`user\` u LEFT JOIN roles r ON r.code = u.role WHERE u.id = ?`,
      [id],
    );
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}
