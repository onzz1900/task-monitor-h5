/**
 * Small 系统管理 tree (not the full official 100+ menus) plus demo users/roles.
 * Columns and codes follow RuoYi-Vue sql/ry_20260417.sql.
 */
import { execute, queryOne } from "./db";

const now = () => new Date();

async function insertDept(
  dept_id: number,
  parent_id: number,
  ancestors: string,
  dept_name: string,
  order_num: number,
  leader: string,
) {
  await execute(
    `INSERT INTO sys_dept (
       dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email,
       status, del_flag, create_by, create_time, update_by, update_time
     ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, '0', '0', 'admin', ?, '', NULL)`,
    [dept_id, parent_id, ancestors, dept_name, order_num, leader, now()],
  );
}

async function insertRole(role_id: number, role_name: string, role_key: string, role_sort: number, remark: string) {
  await execute(
    `INSERT INTO sys_role (
       role_id, role_name, role_key, role_sort, data_scope, menu_check_strictly, dept_check_strictly,
       status, del_flag, create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, ?, '1', 1, 1, '0', '0', 'admin', ?, '', NULL, ?)`,
    [role_id, role_name, role_key, role_sort, now(), remark],
  );
}

async function insertMenu(row: {
  menu_id: number;
  menu_name: string;
  parent_id: number;
  order_num: number;
  path: string;
  component?: string | null;
  menu_type: string;
  perms?: string;
  icon?: string;
  remark?: string;
}) {
  await execute(
    `INSERT INTO sys_menu (
       menu_id, menu_name, parent_id, order_num, path, component, query, route_name,
       is_frame, is_cache, menu_type, visible, status, perms, icon,
       create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, ?, ?, ?, '', '', 1, 0, ?, '0', '0', ?, ?, 'admin', ?, '', NULL, ?)`,
    [
      row.menu_id,
      row.menu_name,
      row.parent_id,
      row.order_num,
      row.path,
      row.component ?? null,
      row.menu_type,
      row.perms ?? "",
      row.icon ?? "#",
      now(),
      row.remark ?? "",
    ],
  );
}

async function insertUser(row: {
  user_id: number;
  dept_id: number;
  user_name: string;
  nick_name: string;
  email: string;
  phonenumber: string;
  sex: string;
  remark: string;
}) {
  const existing = await queryOne<{ user_id: number }>(
    "SELECT user_id FROM sys_user WHERE email = ? OR user_name = ?",
    [row.email, row.user_name],
  );
  if (existing) return Number(existing.user_id);
  await execute(
    `INSERT INTO sys_user (
       user_id, dept_id, user_name, nick_name, user_type, email, phonenumber, sex, avatar, password,
       status, del_flag, login_ip, login_date, pwd_update_date,
       create_by, create_time, update_by, update_time, remark
     ) VALUES (?, ?, ?, ?, '00', ?, ?, ?, '', '', '0', '0', '', NULL, NULL, 'admin', ?, '', NULL, ?)`,
    [row.user_id, row.dept_id, row.user_name, row.nick_name, row.email, row.phonenumber, row.sex, now(), row.remark],
  );
  return row.user_id;
}

export async function seedRuoyi(): Promise<void> {
  await insertDept(100, 0, "0", "任务中心", 0, "周琪");
  await insertDept(101, 100, "0,100", "研发部门", 1, "周琪");
  await insertDept(102, 100, "0,100", "运维部门", 2, "韩澄");
  await insertDept(103, 100, "0,100", "测试部门", 3, "苏晚");

  await insertRole(1, "超级管理员", "admin", 1, "超级管理员");
  await insertRole(2, "值班", "duty", 2, "任务的登记、修改与运行");
  await insertRole(3, "只读", "readonly", 3, "仅可查看任务");

  await insertMenu({
    menu_id: 1,
    menu_name: "系统管理",
    parent_id: 0,
    order_num: 1,
    path: "system",
    menu_type: "M",
    icon: "system",
    remark: "系统管理目录",
  });
  await insertMenu({
    menu_id: 100,
    menu_name: "用户管理",
    parent_id: 1,
    order_num: 1,
    path: "user",
    component: "system/user/index",
    menu_type: "C",
    perms: "system:user:list",
    icon: "user",
    remark: "用户管理菜单",
  });
  await insertMenu({
    menu_id: 101,
    menu_name: "角色管理",
    parent_id: 1,
    order_num: 2,
    path: "role",
    component: "system/role/index",
    menu_type: "C",
    perms: "system:role:list",
    icon: "peoples",
    remark: "角色管理菜单",
  });
  await insertMenu({
    menu_id: 102,
    menu_name: "菜单管理",
    parent_id: 1,
    order_num: 3,
    path: "menu",
    component: "system/menu/index",
    menu_type: "C",
    perms: "system:menu:list",
    icon: "tree-table",
    remark: "菜单管理菜单",
  });
  await insertMenu({
    menu_id: 1000,
    menu_name: "用户查询",
    parent_id: 100,
    order_num: 1,
    path: "",
    menu_type: "F",
    perms: "system:user:query",
  });
  await insertMenu({
    menu_id: 1001,
    menu_name: "用户新增",
    parent_id: 100,
    order_num: 2,
    path: "",
    menu_type: "F",
    perms: "system:user:add",
  });
  await insertMenu({
    menu_id: 1002,
    menu_name: "用户修改",
    parent_id: 100,
    order_num: 3,
    path: "",
    menu_type: "F",
    perms: "system:user:edit",
  });
  await insertMenu({
    menu_id: 1003,
    menu_name: "用户删除",
    parent_id: 100,
    order_num: 4,
    path: "",
    menu_type: "F",
    perms: "system:user:remove",
  });
  await insertMenu({
    menu_id: 1004,
    menu_name: "用户导出",
    parent_id: 100,
    order_num: 5,
    path: "",
    menu_type: "F",
    perms: "system:user:export",
  });
  await insertMenu({
    menu_id: 1005,
    menu_name: "用户导入",
    parent_id: 100,
    order_num: 6,
    path: "",
    menu_type: "F",
    perms: "system:user:import",
  });
  await insertMenu({
    menu_id: 1007,
    menu_name: "角色查询",
    parent_id: 101,
    order_num: 1,
    path: "",
    menu_type: "F",
    perms: "system:role:query",
  });
  await insertMenu({
    menu_id: 1008,
    menu_name: "角色新增",
    parent_id: 101,
    order_num: 2,
    path: "",
    menu_type: "F",
    perms: "system:role:add",
  });
  await insertMenu({
    menu_id: 1009,
    menu_name: "角色修改",
    parent_id: 101,
    order_num: 3,
    path: "",
    menu_type: "F",
    perms: "system:role:edit",
  });
  await insertMenu({
    menu_id: 1010,
    menu_name: "角色删除",
    parent_id: 101,
    order_num: 4,
    path: "",
    menu_type: "F",
    perms: "system:role:remove",
  });
  await insertMenu({
    menu_id: 1011,
    menu_name: "角色导出",
    parent_id: 101,
    order_num: 5,
    path: "",
    menu_type: "F",
    perms: "system:role:export",
  });
  await insertMenu({
    menu_id: 1012,
    menu_name: "菜单查询",
    parent_id: 102,
    order_num: 1,
    path: "",
    menu_type: "F",
    perms: "system:menu:query",
  });
  await insertMenu({
    menu_id: 1013,
    menu_name: "菜单新增",
    parent_id: 102,
    order_num: 2,
    path: "",
    menu_type: "F",
    perms: "system:menu:add",
  });
  await insertMenu({
    menu_id: 1014,
    menu_name: "菜单修改",
    parent_id: 102,
    order_num: 3,
    path: "",
    menu_type: "F",
    perms: "system:menu:edit",
  });
  await insertMenu({
    menu_id: 1015,
    menu_name: "菜单删除",
    parent_id: 102,
    order_num: 4,
    path: "",
    menu_type: "F",
    perms: "system:menu:remove",
  });

  await insertMenu({
    menu_id: 2,
    menu_name: "任务管理",
    parent_id: 0,
    order_num: 2,
    path: "task",
    menu_type: "M",
    icon: "job",
    remark: "任务管理目录",
  });
  await insertMenu({
    menu_id: 200,
    menu_name: "任务列表",
    parent_id: 2,
    order_num: 1,
    path: "list",
    component: "task/index",
    menu_type: "C",
    perms: "task:read",
    icon: "list",
    remark: "任务列表菜单",
  });
  await insertMenu({
    menu_id: 2000,
    menu_name: "任务查询",
    parent_id: 200,
    order_num: 1,
    path: "",
    menu_type: "F",
    perms: "task:read",
  });
  await insertMenu({
    menu_id: 2001,
    menu_name: "任务新增",
    parent_id: 200,
    order_num: 2,
    path: "",
    menu_type: "F",
    perms: "task:create",
  });
  await insertMenu({
    menu_id: 2002,
    menu_name: "任务修改",
    parent_id: 200,
    order_num: 3,
    path: "",
    menu_type: "F",
    perms: "task:update",
  });
  await insertMenu({
    menu_id: 2003,
    menu_name: "任务运行",
    parent_id: 200,
    order_num: 4,
    path: "",
    menu_type: "F",
    perms: "task:run",
  });

  const allMenus = [
    1, 100, 101, 102, 1000, 1001, 1002, 1003, 1004, 1005, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 2, 200,
    2000, 2001, 2002, 2003,
  ];
  for (const menuId of allMenus) {
    await execute("INSERT INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)", [menuId]);
  }
  for (const menuId of [2, 200, 2000, 2001, 2002, 2003]) {
    await execute("INSERT INTO sys_role_menu (role_id, menu_id) VALUES (2, ?)", [menuId]);
  }
  for (const menuId of [2, 200, 2000]) {
    await execute("INSERT INTO sys_role_menu (role_id, menu_id) VALUES (3, ?)", [menuId]);
  }

  const zhou = await insertUser({
    user_id: 1,
    dept_id: 101,
    user_name: "admin",
    nick_name: "周琪",
    email: "admin@tms.local",
    phonenumber: "13800001001",
    sex: "0",
    remark: "超级管理员",
  });
  const han = await insertUser({
    user_id: 2,
    dept_id: 102,
    user_name: "duty",
    nick_name: "韩澄",
    email: "duty@tms.local",
    phonenumber: "13800001002",
    sex: "0",
    remark: "值班",
  });
  const su = await insertUser({
    user_id: 3,
    dept_id: 103,
    user_name: "readonly",
    nick_name: "苏晚",
    email: "readonly@tms.local",
    phonenumber: "13800001003",
    sex: "1",
    remark: "只读",
  });
  await execute("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, 1)", [zhou]);
  await execute("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, 2)", [han]);
  await execute("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, 3)", [su]);
}

/** Official F buttons from ry_20260417.sql — idempotent for already-seeded DBs. */
const OFFICIAL_F = [
  { menu_id: 1004, menu_name: "用户导出", parent_id: 100, order_num: 5, perms: "system:user:export" },
  { menu_id: 1005, menu_name: "用户导入", parent_id: 100, order_num: 6, perms: "system:user:import" },
  { menu_id: 1011, menu_name: "角色导出", parent_id: 101, order_num: 5, perms: "system:role:export" },
] as const;

export async function ensureOfficialFButtons(): Promise<void> {
  for (const row of OFFICIAL_F) {
    const existing = await queryOne<{ menu_id: number }>(
      "SELECT menu_id FROM sys_menu WHERE menu_id = ? OR perms = ?",
      [row.menu_id, row.perms],
    );
    if (!existing) {
      await insertMenu({
        menu_id: row.menu_id,
        menu_name: row.menu_name,
        parent_id: row.parent_id,
        order_num: row.order_num,
        path: "",
        menu_type: "F",
        perms: row.perms,
      });
    }
    const menuId = existing ? Number(existing.menu_id) : row.menu_id;
    await execute("INSERT IGNORE INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)", [menuId]);
  }
}
