/** Official RuoYi sys_* access. Column names match sql/ry_20260417.sql. */
import { execute, query, queryOne } from "./db";

export function nid(value: unknown): number {
  return Number(value);
}

export function fmtTime(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())} ${p(value.getHours())}:${p(value.getMinutes())}:${p(value.getSeconds())}`;
  }
  return String(value).replace("T", " ").slice(0, 19);
}

export type SysDept = {
  dept_id: number;
  parent_id: number;
  ancestors: string;
  dept_name: string;
  order_num: number;
  leader: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  del_flag: string;
};

export type SysRole = {
  role_id: number;
  role_name: string;
  role_key: string;
  role_sort: number;
  data_scope: string;
  menu_check_strictly: number;
  dept_check_strictly: number;
  status: string;
  del_flag: string;
  create_by: string;
  create_time: unknown;
  update_by: string;
  update_time: unknown;
  remark: string | null;
};

export type SysMenu = {
  menu_id: number;
  menu_name: string;
  parent_id: number;
  order_num: number;
  path: string;
  component: string | null;
  query: string | null;
  route_name: string;
  is_frame: number;
  is_cache: number;
  menu_type: string;
  visible: string;
  status: string;
  perms: string | null;
  icon: string;
  create_by: string;
  create_time: unknown;
  update_by: string;
  update_time: unknown;
  remark: string;
};

export type SysUser = {
  user_id: number;
  dept_id: number | null;
  user_name: string;
  nick_name: string;
  user_type: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  password: string;
  status: string;
  del_flag: string;
  login_ip: string;
  login_date: unknown;
  pwd_update_date: unknown;
  create_by: string;
  create_time: unknown;
  update_by: string;
  update_time: unknown;
  remark: string | null;
};

export type MenuNode = SysMenu & { children: MenuNode[] };

export function buildMenuTree(rows: SysMenu[], parentId = 0): MenuNode[] {
  return rows
    .filter((row) => nid(row.parent_id) === parentId)
    .sort((a, b) => nid(a.order_num) - nid(b.order_num) || nid(a.menu_id) - nid(b.menu_id))
    .map((row) => ({ ...row, children: buildMenuTree(rows, nid(row.menu_id)) }));
}

export async function listDepts(): Promise<SysDept[]> {
  const rows = await query<SysDept>("SELECT * FROM sys_dept WHERE del_flag = '0' ORDER BY order_num, dept_id");
  return rows.map((d) => ({ ...d, dept_id: nid(d.dept_id), parent_id: nid(d.parent_id), order_num: nid(d.order_num) }));
}

export async function listRoles(): Promise<SysRole[]> {
  return query<SysRole>("SELECT * FROM sys_role WHERE del_flag = '0' ORDER BY role_sort, role_id");
}

export async function getRole(roleId: number): Promise<SysRole | undefined> {
  return queryOne<SysRole>("SELECT * FROM sys_role WHERE role_id = ? AND del_flag = '0'", [roleId]);
}

export async function listMenus(): Promise<SysMenu[]> {
  return query<SysMenu>("SELECT * FROM sys_menu ORDER BY parent_id, order_num, menu_id");
}

export async function menuIdsForRole(roleId: number): Promise<number[]> {
  const rows = await query<{ menu_id: number }>("SELECT menu_id FROM sys_role_menu WHERE role_id = ?", [roleId]);
  return rows.map((r) => nid(r.menu_id));
}

export async function menuIdsForUser(userId: number): Promise<number[]> {
  const rows = await query<{ menu_id: number }>(
    `SELECT DISTINCT rm.menu_id
     FROM sys_user_role ur
     JOIN sys_role r ON r.role_id = ur.role_id AND r.del_flag = '0' AND r.status = '0'
     JOIN sys_role_menu rm ON rm.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId],
  );
  return rows.map((r) => nid(r.menu_id));
}

export async function replaceRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
  await execute("DELETE FROM sys_role_menu WHERE role_id = ?", [roleId]);
  for (const menuId of menuIds) {
    await execute("INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)", [roleId, menuId]);
  }
}

export async function roleIdsForUser(userId: number): Promise<number[]> {
  const rows = await query<{ role_id: number }>("SELECT role_id FROM sys_user_role WHERE user_id = ?", [userId]);
  return rows.map((r) => nid(r.role_id));
}

export async function replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
  await execute("DELETE FROM sys_user_role WHERE user_id = ?", [userId]);
  for (const roleId of roleIds) {
    await execute("INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)", [userId, roleId]);
  }
}

export type UserListItem = {
  user_id: number;
  user_name: string;
  nick_name: string;
  email: string;
  phonenumber: string;
  sex: string;
  status: string;
  dept_id: number | null;
  dept_name: string;
  remark: string | null;
  create_time: string | null;
  roles: { role_id: number; role_name: string; role_key: string }[];
};

export async function listUsers(): Promise<UserListItem[]> {
  const users = await query<SysUser & { dept_name: string | null }>(
    `SELECT u.*, d.dept_name
     FROM sys_user u
     LEFT JOIN sys_dept d ON d.dept_id = u.dept_id
     WHERE u.del_flag = '0'
     ORDER BY u.user_id`,
  );
  const links = await query<{ user_id: number; role_id: number; role_name: string; role_key: string }>(
    `SELECT ur.user_id, r.role_id, r.role_name, r.role_key
     FROM sys_user_role ur
     JOIN sys_role r ON r.role_id = ur.role_id AND r.del_flag = '0'
     ORDER BY r.role_sort`,
  );
  const byUser = new Map<number, UserListItem["roles"]>();
  for (const link of links) {
    const uid = nid(link.user_id);
    const list = byUser.get(uid) ?? [];
    list.push({ role_id: nid(link.role_id), role_name: link.role_name, role_key: link.role_key });
    byUser.set(uid, list);
  }
  return users.map((u) => ({
    user_id: nid(u.user_id),
    user_name: u.user_name,
    nick_name: u.nick_name,
    email: u.email,
    phonenumber: u.phonenumber,
    sex: String(u.sex ?? "2"),
    status: String(u.status ?? "0"),
    dept_id: u.dept_id == null ? null : nid(u.dept_id),
    dept_name: u.dept_name ?? "",
    remark: u.remark,
    create_time: fmtTime(u.create_time),
    roles: byUser.get(nid(u.user_id)) ?? [],
  }));
}

export async function findSysUserByEmail(email: string): Promise<SysUser | undefined> {
  return queryOne<SysUser>("SELECT * FROM sys_user WHERE email = ? AND del_flag = '0'", [email]);
}

export async function findSysUserByUserName(userName: string): Promise<SysUser | undefined> {
  return queryOne<SysUser>("SELECT * FROM sys_user WHERE user_name = ? AND del_flag = '0'", [userName]);
}

export async function loadPermsForUser(userId: number): Promise<{ roleKeys: string[]; perms: string[] }> {
  const roles = await query<{ role_key: string; status: string }>(
    `SELECT r.role_key, r.status FROM sys_role r
     JOIN sys_user_role ur ON ur.role_id = r.role_id
     WHERE ur.user_id = ? AND r.del_flag = '0'`,
    [userId],
  );
  const roleKeys = roles.map((r) => r.role_key);
  if (roleKeys.includes("admin") && roles.some((r) => r.role_key === "admin" && String(r.status) === "0")) {
    return { roleKeys, perms: ["*"] };
  }
  const rows = await query<{ perms: string }>(
    `SELECT DISTINCT m.perms FROM sys_menu m
     JOIN sys_role_menu rm ON rm.menu_id = m.menu_id
     JOIN sys_user_role ur ON ur.role_id = rm.role_id
     JOIN sys_role r ON r.role_id = ur.role_id AND r.del_flag = '0' AND r.status = '0'
     WHERE ur.user_id = ? AND m.status = '0' AND m.perms IS NOT NULL AND m.perms <> ''`,
    [userId],
  );
  return { roleKeys, perms: rows.map((r) => r.perms) };
}

export type UserWrite = {
  user_name: string;
  nick_name: string;
  email: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  dept_id?: number | null;
  remark?: string | null;
  role_ids?: number[];
};

export async function insertSysUser(input: UserWrite, actorName: string): Promise<number> {
  const now = new Date();
  const info = await execute(
    `INSERT INTO sys_user (
       dept_id, user_name, nick_name, user_type, email, phonenumber, sex, avatar, password,
       status, del_flag, login_ip, login_date, pwd_update_date,
       create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, '00', ?, ?, ?, '', '', ?, '0', '', NULL, NULL, ?, ?, '', NULL, ?)`,
    [
      input.dept_id ?? null,
      input.user_name,
      input.nick_name,
      input.email,
      input.phonenumber ?? "",
      input.sex ?? "0",
      input.status ?? "0",
      actorName,
      now,
      input.remark ?? null,
    ],
  );
  const userId = Number(info.insertId);
  if (input.role_ids?.length) await replaceUserRoles(userId, input.role_ids);
  return userId;
}

export async function updateSysUser(userId: number, input: UserWrite, actorName: string): Promise<void> {
  await execute(
    `UPDATE sys_user SET
       dept_id = ?, user_name = ?, nick_name = ?, email = ?, phonenumber = ?, sex = ?,
       status = ?, remark = ?, update_by = ?, update_time = ?
     WHERE user_id = ? AND del_flag = '0'`,
    [
      input.dept_id ?? null,
      input.user_name,
      input.nick_name,
      input.email,
      input.phonenumber ?? "",
      input.sex ?? "0",
      input.status ?? "0",
      input.remark ?? null,
      actorName,
      new Date(),
      userId,
    ],
  );
  if (input.role_ids) await replaceUserRoles(userId, input.role_ids);
}

export type RoleWrite = {
  role_name: string;
  role_key: string;
  role_sort?: number;
  status?: string;
  remark?: string | null;
  menu_ids?: number[];
};

export async function insertSysRole(input: RoleWrite, actorName: string): Promise<number> {
  const info = await execute(
    `INSERT INTO sys_role (
       role_name, role_key, role_sort, data_scope, menu_check_strictly, dept_check_strictly,
       status, del_flag, create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, '1', 1, 1, ?, '0', ?, ?, '', NULL, ?)`,
    [
      input.role_name,
      input.role_key,
      input.role_sort ?? 0,
      input.status ?? "0",
      actorName,
      new Date(),
      input.remark ?? null,
    ],
  );
  const roleId = Number(info.insertId);
  if (input.menu_ids) await replaceRoleMenus(roleId, input.menu_ids);
  return roleId;
}

export async function updateSysRole(roleId: number, input: RoleWrite, actorName: string): Promise<void> {
  await execute(
    `UPDATE sys_role SET
       role_name = ?, role_key = ?, role_sort = ?, status = ?, remark = ?,
       update_by = ?, update_time = ?
     WHERE role_id = ? AND del_flag = '0'`,
    [
      input.role_name,
      input.role_key,
      input.role_sort ?? 0,
      input.status ?? "0",
      input.remark ?? null,
      actorName,
      new Date(),
      roleId,
    ],
  );
  if (input.menu_ids) await replaceRoleMenus(roleId, input.menu_ids);
}

export type MenuWrite = {
  menu_name: string;
  parent_id?: number;
  order_num?: number;
  path?: string;
  component?: string | null;
  query?: string | null;
  route_name?: string;
  is_frame?: number;
  is_cache?: number;
  menu_type: string;
  visible?: string;
  status?: string;
  perms?: string | null;
  icon?: string;
  remark?: string;
};

export async function insertSysMenu(input: MenuWrite, actorName: string): Promise<number> {
  const info = await execute(
    `INSERT INTO sys_menu (
       menu_name, parent_id, order_num, path, component, query, route_name,
       is_frame, is_cache, menu_type, visible, status, perms, icon,
       create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', NULL, ?)`,
    [
      input.menu_name,
      input.parent_id ?? 0,
      input.order_num ?? 0,
      input.path ?? "",
      input.component ?? null,
      input.query ?? null,
      input.route_name ?? "",
      input.is_frame ?? 1,
      input.is_cache ?? 0,
      input.menu_type,
      input.visible ?? "0",
      input.status ?? "0",
      input.perms ?? null,
      input.icon ?? "#",
      actorName,
      new Date(),
      input.remark ?? "",
    ],
  );
  return Number(info.insertId);
}

export async function updateSysMenu(menuId: number, input: MenuWrite, actorName: string): Promise<void> {
  await execute(
    `UPDATE sys_menu SET
       menu_name = ?, parent_id = ?, order_num = ?, path = ?, component = ?, query = ?,
       route_name = ?, is_frame = ?, is_cache = ?, menu_type = ?, visible = ?, status = ?,
       perms = ?, icon = ?, remark = ?, update_by = ?, update_time = ?
     WHERE menu_id = ?`,
    [
      input.menu_name,
      input.parent_id ?? 0,
      input.order_num ?? 0,
      input.path ?? "",
      input.component ?? null,
      input.query ?? null,
      input.route_name ?? "",
      input.is_frame ?? 1,
      input.is_cache ?? 0,
      input.menu_type,
      input.visible ?? "0",
      input.status ?? "0",
      input.perms ?? null,
      input.icon ?? "#",
      input.remark ?? "",
      actorName,
      new Date(),
      menuId,
    ],
  );
}

export function serializeRole(role: SysRole, menuIds?: number[]) {
  return {
    role_id: nid(role.role_id),
    role_name: role.role_name,
    role_key: role.role_key,
    role_sort: nid(role.role_sort),
    data_scope: String(role.data_scope),
    menu_check_strictly: nid(role.menu_check_strictly),
    dept_check_strictly: nid(role.dept_check_strictly),
    status: String(role.status),
    remark: role.remark,
    create_time: fmtTime(role.create_time),
    menu_ids: menuIds ?? [],
  };
}

export type MenuTreeDTO = ReturnType<typeof serializeMenu> & { children: MenuTreeDTO[] };

export function serializeMenuTree(nodes: MenuNode[]): MenuTreeDTO[] {
  return nodes.map((node) => ({ ...serializeMenu(node), children: serializeMenuTree(node.children) }));
}

export function serializeMenu(menu: SysMenu) {
  return {
    menu_id: nid(menu.menu_id),
    menu_name: menu.menu_name,
    parent_id: nid(menu.parent_id),
    order_num: nid(menu.order_num),
    path: menu.path,
    component: menu.component,
    query: menu.query,
    route_name: menu.route_name,
    is_frame: nid(menu.is_frame),
    is_cache: nid(menu.is_cache),
    menu_type: String(menu.menu_type),
    visible: String(menu.visible),
    status: String(menu.status),
    perms: menu.perms ?? "",
    icon: menu.icon,
    remark: menu.remark,
    create_time: fmtTime(menu.create_time),
  };
}
