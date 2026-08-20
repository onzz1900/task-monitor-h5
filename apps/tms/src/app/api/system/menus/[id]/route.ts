import { NextResponse } from "next/server";

import { asCount, execute, queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { listMenus, type MenuWrite, serializeMenu, updateSysMenu } from "@/lib/ruoyi";

function readWrite(body: Record<string, unknown>): MenuWrite {
  return {
    menu_name: String(body.menu_name ?? "").trim(),
    parent_id: body.parent_id == null ? 0 : Number(body.parent_id),
    order_num: body.order_num == null ? 0 : Number(body.order_num),
    path: String(body.path ?? ""),
    component: body.component == null ? null : String(body.component),
    menu_type: String(body.menu_type ?? "C"),
    visible: String(body.visible ?? "0"),
    status: String(body.status ?? "0"),
    perms: body.perms == null ? "" : String(body.perms),
    icon: body.icon == null ? "#" : String(body.icon),
    remark: body.remark == null ? "" : String(body.remark),
  };
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("system:menu:edit");
    const menuId = Number((await ctx.params).id);
    const input = readWrite((await req.json()) as Record<string, unknown>);
    if (!input.menu_name) throw new ApiError(400, "菜单名不能为空");
    if (input.parent_id === menuId) throw new ApiError(400, "上级菜单不能是自己");
    if (!["M", "C", "F"].includes(input.menu_type)) throw new ApiError(400, "菜单类型无效");
    await updateSysMenu(menuId, input, actor.name);
    const rows = await listMenus();
    const updated = rows.find((m) => Number(m.menu_id) === menuId);
    if (!updated) throw new ApiError(404, "菜单不存在");
    return NextResponse.json(serializeMenu(updated));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("system:menu:remove");
    const menuId = Number((await ctx.params).id);
    const children = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sys_menu WHERE parent_id = ?", [menuId]);
    if (asCount(children?.n) > 0) throw new ApiError(400, "存在子菜单，不能删除");
    const info = await execute("DELETE FROM sys_menu WHERE menu_id = ?", [menuId]);
    if (info.affectedRows === 0) throw new ApiError(404, "菜单不存在");
    await execute("DELETE FROM sys_role_menu WHERE menu_id = ?", [menuId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
