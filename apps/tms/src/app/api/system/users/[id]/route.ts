import { NextResponse } from "next/server";

import { execute, queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { findSysUserByEmail, findSysUserByUserName, listUsers, type UserWrite, updateSysUser } from "@/lib/ruoyi";

function readWrite(body: Record<string, unknown>): UserWrite {
  return {
    user_name: String(body.user_name ?? "").trim(),
    nick_name: String(body.nick_name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    phonenumber: String(body.phonenumber ?? "").trim(),
    sex: String(body.sex ?? "0"),
    status: String(body.status ?? "0"),
    dept_id: body.dept_id == null || body.dept_id === "" ? null : Number(body.dept_id),
    remark: body.remark == null ? null : String(body.remark),
    role_ids: Array.isArray(body.role_ids) ? body.role_ids.map((id) => Number(id)) : [],
  };
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("system:user:edit");
    const userId = Number((await ctx.params).id);
    const input = readWrite((await req.json()) as Record<string, unknown>);
    if (!input.user_name || !input.nick_name || !input.email) {
      throw new ApiError(400, "用户名、昵称、邮箱不能为空");
    }
    const byName = await findSysUserByUserName(input.user_name);
    if (byName && Number(byName.user_id) !== userId) throw new ApiError(400, "用户名已存在");
    const byEmail = await findSysUserByEmail(input.email);
    if (byEmail && Number(byEmail.user_id) !== userId) throw new ApiError(400, "邮箱已存在");
    await updateSysUser(userId, input, actor.name);
    const primaryRole = input.role_ids?.[0];
    if (primaryRole) {
      const role = await queryOne<{ role_key: string }>("SELECT role_key FROM sys_role WHERE role_id = ?", [
        primaryRole,
      ]);
      if (role)
        await execute("UPDATE `user` SET role = ?, name = ? WHERE email = ?", [
          role.role_key,
          input.nick_name,
          input.email,
        ]);
    } else {
      await execute("UPDATE `user` SET name = ? WHERE email = ?", [input.nick_name, input.email]);
    }
    const users = await listUsers();
    const user = users.find((u) => u.user_id === userId);
    if (!user) throw new ApiError(404, "用户不存在");
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("system:user:remove");
    const userId = Number((await ctx.params).id);
    if (actor.sysUserId === userId) throw new ApiError(400, "不能删除当前登录用户");
    const info = await execute(
      "UPDATE sys_user SET del_flag = '2', update_by = ?, update_time = ? WHERE user_id = ? AND del_flag = '0'",
      [actor.name, new Date(), userId],
    );
    if (info.affectedRows === 0) throw new ApiError(404, "用户不存在");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
