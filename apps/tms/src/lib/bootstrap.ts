/** 服务端读取当前会话、权限与可见菜单。布局与 /api/bootstrap 共用，避免客户端空等。 */
import { query, queryOne } from "./db";
import { getSessionUser } from "./rbac";
import type { Bootstrap } from "./types";

export async function loadBootstrap(): Promise<Bootstrap | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const menus = (
    await query<{
      title: string;
      path: string;
      sort: number;
      permission_code: string;
    }>("SELECT title, path, sort, permission_code FROM menus ORDER BY sort")
  ).filter((m) => user.permissions.includes(m.permission_code));

  const roleName = (await queryOne<{ name: string }>("SELECT name FROM roles WHERE code = ?", [user.role]))?.name;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      role_name: roleName ?? user.role,
    },
    permissions: user.permissions,
    menus,
  };
}
