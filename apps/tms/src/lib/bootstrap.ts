/** 服务端读取当前会话、权限与可见菜单。布局与 /api/bootstrap 共用。 */
import { hasPerm } from "./perms";
import { getSessionUser } from "./rbac";
import { listMenus, listRoles, menuIdsForUser } from "./ruoyi";
import { buildSysMenuNav } from "./sidebar-filter";
import type { Bootstrap } from "./types";

export async function loadBootstrap(): Promise<Bootstrap | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const allMenus = await listMenus();
  const menus = allMenus
    .filter((m) => String(m.menu_type) === "C" && String(m.visible) === "0" && String(m.status) === "0")
    .filter((m) => !m.perms || hasPerm(user.permissions, m.perms))
    .map((m) => ({
      title: m.menu_name,
      path: m.path,
      sort: Number(m.order_num),
      permission_code: m.perms ?? "",
    }));

  const grantedIds = user.sysUserId ? await menuIdsForUser(user.sysUserId) : [];
  const nav = user.permissions.includes("*")
    ? []
    : buildSysMenuNav({ menus: allMenus, grantedIds, permissions: user.permissions });

  const roleName = (await listRoles()).find((r) => r.role_key === user.role)?.role_name ?? user.role;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      role_name: roleName,
      status: user.status,
    },
    permissions: user.permissions,
    menus,
    nav,
    disabled: user.disabled,
  };
}
