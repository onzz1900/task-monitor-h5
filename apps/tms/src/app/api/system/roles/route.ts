import { NextResponse } from "next/server";

import { queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { insertSysRole, listRoles, menuIdsForRole, type RoleWrite, serializeRole } from "@/lib/ruoyi";

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

export async function GET() {
  try {
    await requirePermission("system:role:list");
    const roles = await listRoles();
    const result = [];
    for (const role of roles) {
      result.push(serializeRole(role, await menuIdsForRole(Number(role.role_id))));
    }
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission("system:role:add");
    const input = readWrite((await req.json()) as Record<string, unknown>);
    if (!input.role_name || !input.role_key) throw new ApiError(400, "角色名、权限字符不能为空");
    const dup = await queryOne("SELECT role_id FROM sys_role WHERE role_key = ? AND del_flag = '0'", [input.role_key]);
    if (dup) throw new ApiError(400, "权限字符已存在");
    const roleId = await insertSysRole(input, actor.name);
    const role = await queryOne("SELECT * FROM sys_role WHERE role_id = ?", [roleId]);
    return NextResponse.json(serializeRole(role as never, input.menu_ids ?? []), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
