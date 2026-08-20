/**
 * Sidebar: admin (`*`) keeps the official template list.
 * Everyone else gets M/C rows from sys_menu + sys_role_menu (no URL_PERMS filter).
 */
import { CheckSquare, Kanban, Lock, type LucideIcon, Menu, Users } from "lucide-react";

import { type NavGroup, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { hasPerm } from "./perms";
import type { SysMenu } from "./ruoyi";

export type SidebarNavDto = {
  id: number;
  label: string;
  items: { id: string; title: string; url: string }[];
};

const ICON_BY_URL: Record<string, LucideIcon> = {
  "/dashboard/users": Users,
  "/dashboard/roles": Lock,
  "/dashboard/menus": Menu,
  "/dashboard/tasks": CheckSquare,
  "/dashboard/kanban": Kanban,
};

/** Map official C.path / component onto existing Next routes. */
export function mapSysMenuToRoute(path: string, component?: string | null): string | null {
  const p = String(path)
    .trim()
    .replace(/^\/+/, "")
    .toLowerCase();
  const c = String(component ?? "")
    .trim()
    .replace(/^\/+/, "")
    .toLowerCase();
  const blob = `${p} ${c}`;

  if (p === "dashboard/users" || p === "users" || p === "user" || p === "system/user" || blob.includes("system/user")) {
    return "/dashboard/users";
  }
  if (p === "dashboard/roles" || p === "roles" || p === "role" || p === "system/role" || blob.includes("system/role")) {
    return "/dashboard/roles";
  }
  if (p === "dashboard/menus" || p === "menus" || p === "menu" || p === "system/menu" || blob.includes("system/menu")) {
    return "/dashboard/menus";
  }
  if (
    p === "dashboard/tasks" ||
    p === "tasks" ||
    p === "list" ||
    p === "task" ||
    p === "task/list" ||
    blob.includes("task/index") ||
    blob.includes("task/list")
  ) {
    return "/dashboard/tasks";
  }
  if (p === "dashboard/kanban" || p === "kanban") {
    return "/dashboard/kanban";
  }
  return null;
}

export function buildSysMenuNav(args: {
  menus: SysMenu[];
  grantedIds: number[];
  permissions: string[];
}): SidebarNavDto[] {
  const granted = new Set(args.grantedIds.map(Number));
  const visible = args.menus.filter(
    (m) => (m.menu_type === "M" || m.menu_type === "C") && String(m.visible) === "0" && String(m.status) === "0",
  );
  const byId = new Map(visible.map((m) => [Number(m.menu_id), m]));

  const children: { menu: SysMenu; url: string }[] = [];
  for (const menu of visible) {
    if (menu.menu_type !== "C") continue;
    if (!granted.has(Number(menu.menu_id))) continue;
    if (!menu.perms || !hasPerm(args.permissions, menu.perms)) continue;
    const url = mapSysMenuToRoute(menu.path, menu.component);
    if (!url) continue;
    children.push({ menu, url });
  }

  const groups = new Map<number, SidebarNavDto>();

  function ensureGroup(parentId: number, fallbackLabel: string): SidebarNavDto {
    const existing = groups.get(parentId);
    if (existing) return existing;
    const parent = byId.get(parentId);
    const dto: SidebarNavDto = {
      id: parentId || Number(children[0]?.menu.menu_id ?? 0),
      label: parent?.menu_name ?? fallbackLabel,
      items: [],
    };
    groups.set(parentId, dto);
    return dto;
  }

  for (const { menu, url } of children.sort(
    (a, b) => Number(a.menu.order_num) - Number(b.menu.order_num) || Number(a.menu.menu_id) - Number(b.menu.menu_id),
  )) {
    const parentId = Number(menu.parent_id);
    const group = ensureGroup(parentId, menu.menu_name);
    if (!group.items.some((item) => item.url === url)) {
      group.items.push({ id: String(menu.menu_id), title: menu.menu_name, url });
    }
  }

  if (hasPerm(args.permissions, "task:read")) {
    const taskGroup = [...groups.values()].find((g) => g.items.some((item) => item.url === "/dashboard/tasks"));
    if (taskGroup && !taskGroup.items.some((item) => item.url === "/dashboard/kanban")) {
      taskGroup.items.push({ id: "kanban", title: "Kanban", url: "/dashboard/kanban" });
    }
  }

  return [...groups.values()]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => {
      const pa = byId.get(a.id);
      const pb = byId.get(b.id);
      return Number(pa?.order_num ?? 99) - Number(pb?.order_num ?? 99) || a.id - b.id;
    });
}

export function hydrateSysMenuNav(groups: SidebarNavDto[]): NavGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      icon: ICON_BY_URL[item.url],
    })),
  }));
}

export function filterSidebarItems(permissions: string[]): NavGroup[] {
  if (permissions.includes("*")) return sidebarItems;
  return [];
}
