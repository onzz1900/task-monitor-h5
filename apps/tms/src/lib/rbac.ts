/** 会话解析与接口级 RBAC 校验。 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db";
import { ensureReady } from "./init";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
};

export function permissionsForRole(roleCode: string): string[] {
  const rows = db()
    .prepare(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.code = ? ORDER BY p.id`
    )
    .all(roleCode) as { code: string }[];
  return rows.map((r) => r.code);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureReady();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string };
  const role = u.role ?? "readonly";
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role,
    permissions: permissionsForRole(role),
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** 在 Route Handler 中调用：无会话 401，缺权限 403。 */
export async function requirePermission(code: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "未登录");
  if (!user.permissions.includes(code)) throw new ApiError(403, `缺少权限：${code}`);
  return user;
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ detail: "服务内部错误" }, { status: 500 });
}
