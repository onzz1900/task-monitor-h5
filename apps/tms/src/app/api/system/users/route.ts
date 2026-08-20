import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { findSysUserByEmail, findSysUserByUserName, insertSysUser, listUsers, type UserWrite } from "@/lib/ruoyi";

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

export async function GET() {
  try {
    await requirePermission("system:user:list");
    return NextResponse.json(await listUsers());
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission("system:user:add");
    const body = (await req.json()) as Record<string, unknown>;
    const input = readWrite(body);
    const password = String(body.password ?? "");
    if (!input.user_name || !input.nick_name || !input.email) {
      throw new ApiError(400, "用户名、昵称、邮箱不能为空");
    }
    if (password.length < 6) throw new ApiError(400, "密码至少 6 位");
    if (await findSysUserByUserName(input.user_name)) throw new ApiError(400, "用户名已存在");
    if (await findSysUserByEmail(input.email)) throw new ApiError(400, "邮箱已存在");

    const exists = await queryOne<{ id: string }>("SELECT id FROM `user` WHERE email = ?", [input.email]);
    if (!exists) {
      await auth.api.signUpEmail({ body: { email: input.email, password, name: input.nick_name } });
    }
    const primaryRole = input.role_ids?.[0];
    if (primaryRole) {
      const role = await queryOne<{ role_key: string }>("SELECT role_key FROM sys_role WHERE role_id = ?", [
        primaryRole,
      ]);
      if (role) await execute("UPDATE `user` SET role = ? WHERE email = ?", [role.role_key, input.email]);
    }
    const userId = await insertSysUser(input, actor.name);
    const users = await listUsers();
    return NextResponse.json(
      users.find((u) => u.user_id === userId),
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
