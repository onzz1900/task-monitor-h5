/** 会话解析与接口级 RBAC。权限来自 sys_*（若依），登录仍走 Better Auth。 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "./auth";
import { ensureReady } from "./init";
import { hasPerm } from "./perms";
import { findSysUserByEmail, loadPermsForUser } from "./ruoyi";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  sysUserId: number | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureReady();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string };
  const sys = await findSysUserByEmail(u.email);
  const loaded = sys
    ? await loadPermsForUser(Number(sys.user_id))
    : { roleKeys: [] as string[], perms: [] as string[] };
  const role = loaded.roleKeys[0] ?? u.role ?? "readonly";
  return {
    id: u.id,
    email: u.email,
    name: sys?.nick_name ?? u.name,
    role,
    permissions: loaded.perms,
    sysUserId: sys ? Number(sys.user_id) : null,
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** 在 Route Handler 中调用：无会话 401，缺权限 403。 */
export async function requirePermission(code: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "未登录");
  if (!hasPerm(user.permissions, code)) throw new ApiError(403, `缺少权限：${code}`);
  return user;
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ detail: "服务内部错误" }, { status: 500 });
}
