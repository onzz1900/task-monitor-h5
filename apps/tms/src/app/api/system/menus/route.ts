import { NextResponse } from "next/server";

import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { buildMenuTree, insertSysMenu, listMenus, type MenuWrite, serializeMenu, serializeMenuTree } from "@/lib/ruoyi";

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

export async function GET() {
  try {
    await requirePermission("system:menu:list");
    const menus = await listMenus();
    return NextResponse.json({
      rows: menus.map(serializeMenu),
      tree: serializeMenuTree(buildMenuTree(menus)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission("system:menu:add");
    const input = readWrite((await req.json()) as Record<string, unknown>);
    if (!input.menu_name) throw new ApiError(400, "菜单名不能为空");
    if (!["M", "C", "F"].includes(input.menu_type)) throw new ApiError(400, "菜单类型无效");
    const menuId = await insertSysMenu(input, actor.name);
    const rows = await listMenus();
    const created = rows.find((m) => Number(m.menu_id) === menuId);
    if (!created) throw new ApiError(500, "菜单写入失败");
    return NextResponse.json(serializeMenu(created), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
