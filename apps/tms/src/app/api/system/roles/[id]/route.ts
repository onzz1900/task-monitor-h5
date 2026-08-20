import { NextResponse } from "next/server";

import { execute, queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { getRole, menuIdsForRole, type RoleWrite, serializeRole, updateSysRole } from "@/lib/ruoyi";

function readWrite(body: Record<string, unknown>): RoleWrite {
  return {
    role_name: String(body.role_name ?? "").trim(),
    role_key: String(body.role_key ?? "").trim(),
    role_sort: body.role_sort == null ? 0 : Number(body.role_sort),
    status: String(body.status ?? "0"),
    remark: body.remark == null ? null : String(body.remark),
    menu_ids: Array.isArray(body.menu_ids) ? body.menu_ids.map((id) => Number(id)) : undefined,
  };
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("system:role:edit");
    const roleId = Number((await ctx.params).id);
    const existing = await getRole(roleId);
    if (!existing) throw new ApiError(404, "角色不存在");
    const input = readWrite((await req.json()) as Record<string, unknown>);
    if (!input.role_name || !input.role_key) throw new ApiError(400, "角色名、权限字符不能为空");
    const dup = await queryOne<{ role_id: number }>(
      "SELECT role_id FROM sys_role WHERE role_key = ? AND del_flag = '0'",
      [input.role_key],
    );
    if (dup && Number(dup.role_id) !== roleId) throw new ApiError(400, "权限字符已存在");
    await updateSysRole(roleId, input, actor.name);
    const role = await getRole(roleId);
    if (!role) throw new ApiError(404, "角色不存在");
    return NextResponse.json(serializeRole(role, await menuIdsForRole(roleId)));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("system:role:remove");
    const roleId = Number((await ctx.params).id);
    const existing = await getRole(roleId);
    if (!existing) throw new ApiError(404, "角色不存在");
    if (existing.role_key === "admin") throw new ApiError(400, "不能删除超级管理员角色");
    await execute("UPDATE sys_role SET del_flag = '2', update_by = ?, update_time = ? WHERE role_id = ?", [
      actor.name,
      new Date(),
      roleId,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
