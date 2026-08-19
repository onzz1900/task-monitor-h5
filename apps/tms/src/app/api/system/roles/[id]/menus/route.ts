import { NextResponse } from "next/server";

import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { getRole, menuIdsForRole, replaceRoleMenus } from "@/lib/ruoyi";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("system:role:list");
    const roleId = Number((await ctx.params).id);
    if (!(await getRole(roleId))) throw new ApiError(404, "角色不存在");
    return NextResponse.json({ menu_ids: await menuIdsForRole(roleId) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("system:role:edit");
    const roleId = Number((await ctx.params).id);
    if (!(await getRole(roleId))) throw new ApiError(404, "角色不存在");
    const body = (await req.json()) as { menu_ids?: unknown };
    const menuIds = Array.isArray(body.menu_ids) ? body.menu_ids.map((id) => Number(id)) : [];
    await replaceRoleMenus(roleId, menuIds);
    return NextResponse.json({ menu_ids: await menuIdsForRole(roleId) });
  } catch (err) {
    return handleApiError(err);
  }
}
