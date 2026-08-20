/**
 * Permission API checks + sys_menu route mapping.
 * Run: npm run test:perms  (needs Next on BASE_URL, default http://localhost:3000)
 */
import type { SysMenu } from "../lib/ruoyi";
import { buildSysMenuNav, mapSysMenuToRoute } from "../lib/sidebar-filter";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function menu(partial: Partial<SysMenu> & Pick<SysMenu, "menu_id" | "menu_name" | "menu_type">): SysMenu {
  return {
    parent_id: 0,
    order_num: 0,
    path: "",
    component: null,
    query: null,
    route_name: "",
    is_frame: 1,
    is_cache: 0,
    visible: "0",
    status: "0",
    perms: "",
    icon: "#",
    create_by: "",
    create_time: null,
    update_by: "",
    update_time: null,
    remark: "",
    ...partial,
  };
}

function testNavMapping() {
  assert(mapSysMenuToRoute("user", "system/user/index") === "/dashboard/users", "user → users");
  assert(mapSysMenuToRoute("role", "system/role/index") === "/dashboard/roles", "role → roles");
  assert(mapSysMenuToRoute("menu", "system/menu/index") === "/dashboard/menus", "menu → menus");
  assert(mapSysMenuToRoute("list", "task/index") === "/dashboard/tasks", "list → tasks");

  const nav = buildSysMenuNav({
    menus: [
      menu({ menu_id: 2, menu_name: "任务管理", menu_type: "M", order_num: 2, path: "task" }),
      menu({
        menu_id: 200,
        parent_id: 2,
        menu_name: "任务列表",
        menu_type: "C",
        path: "list",
        component: "task/index",
        perms: "task:read",
      }),
      menu({
        menu_id: 100,
        parent_id: 1,
        menu_name: "用户管理",
        menu_type: "C",
        path: "user",
        component: "system/user/index",
        perms: "system:user:list",
      }),
    ],
    grantedIds: [2, 200],
    permissions: ["task:read", "task:create"],
  });
  assert(nav.length === 1 && nav[0].label === "任务管理", "duty nav is 任务管理 group");
  assert(
    nav[0].items.some((i) => i.url === "/dashboard/tasks") && nav[0].items.some((i) => i.url === "/dashboard/kanban"),
    "task list + kanban",
  );
  assert(!nav.some((g) => g.items.some((i) => i.url === "/dashboard/users")), "no users without grant");
  console.log("ok  nav mapping");
}

function cookieJar(res: Response, prev = ""): string {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const next = new Map<string, string>();
  for (const part of prev.split(";").map((s) => s.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq > 0) next.set(part.slice(0, eq), part);
  }
  for (const line of raw) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) next.set(pair.slice(0, eq), pair);
  }
  return [...next.values()].join("; ");
}

async function signIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  const cookie = cookieJar(res);
  assert(res.ok && cookie, `sign-in failed for ${email}: ${res.status} ${await res.text()}`);
  return cookie;
}

async function call(
  method: string,
  path: string,
  cookie: string | null,
  body?: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const headers: Record<string, string> = { Origin: BASE };
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function expectStatus(
  method: string,
  path: string,
  cookie: string | null,
  want: number,
  body?: unknown,
  label?: string,
) {
  const got = await call(method, path, cookie, body);
  assert(
    got.status === want,
    `${label ?? `${method} ${path}`} expected ${want} got ${got.status} ${JSON.stringify(got.json)}`,
  );
  console.log(`ok  ${label ?? `${method} ${path}`} → ${want}`);
  return got;
}

const taskBody = {
  title: "perm-test-task",
  type: "review",
  schedule_kind: "cron",
  cron_expr: "0 0 * * *",
};

async function testApis() {
  const admin = await signIn("admin@tms.local", "admin123");
  const duty = await signIn("duty@tms.local", "duty123");
  const readonly = await signIn("readonly@tms.local", "read123");
  const stamp = Date.now();

  await expectStatus("POST", "/api/system/users", null, 401, {
    user_name: "x",
    nick_name: "x",
    email: "x@tms.local",
    password: "secret1",
  }, "user add no cookie");
  await expectStatus("POST", "/api/system/users", duty, 403, {
    user_name: `d${stamp}`,
    nick_name: "duty-blocked",
    email: `d${stamp}@tms.local`,
    password: "secret1",
  }, "duty user add");
  await expectStatus("POST", "/api/system/users", readonly, 403, {
    user_name: `r${stamp}`,
    nick_name: "ro-blocked",
    email: `r${stamp}@tms.local`,
    password: "secret1",
  }, "readonly user add");

  const createdUser = await expectStatus("POST", "/api/system/users", admin, 201, {
    user_name: `u${stamp}`,
    nick_name: "perm user",
    email: `u${stamp}@tms.local`,
    password: "secret1",
    role_ids: [3],
  }, "admin user add");
  const userId = createdUser.json.user_id;

  await expectStatus("PUT", `/api/system/users/${userId}`, duty, 403, {
    user_name: `u${stamp}`,
    nick_name: "nope",
    email: `u${stamp}@tms.local`,
  }, "duty user edit");
  await expectStatus("PUT", `/api/system/users/${userId}`, admin, 200, {
    user_name: `u${stamp}`,
    nick_name: "perm user 2",
    email: `u${stamp}@tms.local`,
    role_ids: [3],
  }, "admin user edit");
  await expectStatus("DELETE", `/api/system/users/${userId}`, duty, 403, undefined, "duty user remove");
  await expectStatus("DELETE", `/api/system/users/${userId}`, admin, 200, undefined, "admin user remove");

  await expectStatus("POST", "/api/system/roles", null, 401, { role_name: "x", role_key: "x" }, "role add no cookie");
  await expectStatus("POST", "/api/system/roles", duty, 403, { role_name: "x", role_key: `d${stamp}` }, "duty role add");
  const createdRole = await expectStatus(
    "POST",
    "/api/system/roles",
    admin,
    201,
    { role_name: `perm-role-${stamp}`, role_key: `pr${stamp}`, role_sort: 9, status: "0" },
    "admin role add",
  );
  const roleId = createdRole.json.role_id;
  await expectStatus(
    "PUT",
    `/api/system/roles/${roleId}`,
    duty,
    403,
    { role_name: "nope", role_key: `pr${stamp}` },
    "duty role edit",
  );
  await expectStatus(
    "PUT",
    `/api/system/roles/${roleId}`,
    admin,
    200,
    { role_name: `perm-role-${stamp}-2`, role_key: `pr${stamp}`, role_sort: 9, status: "0" },
    "admin role edit",
  );
  await expectStatus("DELETE", `/api/system/roles/${roleId}`, readonly, 403, undefined, "readonly role remove");
  await expectStatus("DELETE", `/api/system/roles/${roleId}`, admin, 200, undefined, "admin role remove");

  await expectStatus("POST", "/api/system/menus", null, 401, { menu_name: "x", menu_type: "F" }, "menu add no cookie");
  await expectStatus("POST", "/api/system/menus", duty, 403, { menu_name: "x", menu_type: "F" }, "duty menu add");
  const createdMenu = await expectStatus(
    "POST",
    "/api/system/menus",
    admin,
    201,
    { menu_name: `perm-f-${stamp}`, parent_id: 200, order_num: 99, menu_type: "F", perms: "" },
    "admin menu add",
  );
  const menuId = createdMenu.json.menu_id;
  await expectStatus(
    "PUT",
    `/api/system/menus/${menuId}`,
    duty,
    403,
    { menu_name: "nope", menu_type: "F" },
    "duty menu edit",
  );
  await expectStatus(
    "PUT",
    `/api/system/menus/${menuId}`,
    admin,
    200,
    { menu_name: `perm-f-${stamp}-2`, parent_id: 200, menu_type: "F", perms: "" },
    "admin menu edit",
  );
  await expectStatus("DELETE", `/api/system/menus/${menuId}`, readonly, 403, undefined, "readonly menu remove");
  await expectStatus("DELETE", `/api/system/menus/${menuId}`, admin, 200, undefined, "admin menu remove");

  await expectStatus("POST", "/api/tasks", null, 401, taskBody, "task create no cookie");
  await expectStatus("POST", "/api/tasks", readonly, 403, taskBody, "readonly task create");
  const createdTask = await expectStatus("POST", "/api/tasks", duty, 201, taskBody, "duty task create");
  const taskId = createdTask.json.id;
  await expectStatus(
    "PUT",
    `/api/tasks/${taskId}`,
    readonly,
    403,
    { ...taskBody, title: "nope" },
    "readonly task update",
  );
  await expectStatus(
    "PUT",
    `/api/tasks/${taskId}`,
    duty,
    200,
    { ...taskBody, title: "perm-test-task-2" },
    "duty task update",
  );
}

async function main() {
  testNavMapping();
  await testApis();
  console.log("all perm tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
