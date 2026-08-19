/**
 * Filter official sidebar items by RuoYi grants. Admin (`*`) sees the full
 * template list unchanged. Non-admin only keeps URLs backed by sys_menu.perms.
 */
import { type NavGroup, type NavMainItem, type NavSubItem, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { hasPerm } from "./perms";

const URL_PERMS: Record<string, string> = {
  "/dashboard/tasks": "task:read",
  "/dashboard/kanban": "task:read",
  "/dashboard/users": "system:user:list",
  "/dashboard/roles": "system:role:list",
  "/dashboard/menus": "system:menu:list",
};

function canUrl(url: string | undefined, permissions: string[]): boolean {
  if (!url) return false;
  const perm = URL_PERMS[url];
  return perm ? hasPerm(permissions, perm) : false;
}

function filterItem(item: NavMainItem, permissions: string[]): NavMainItem | null {
  if (item.subItems) {
    const subItems = item.subItems.filter((sub: NavSubItem) => canUrl(sub.url, permissions));
    if (subItems.length === 0) return null;
    return { ...item, subItems };
  }
  return canUrl(item.url, permissions) ? item : null;
}

export function filterSidebarItems(permissions: string[]): NavGroup[] {
  if (permissions.includes("*")) return sidebarItems;
  return sidebarItems
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterItem(item, permissions))
        .filter((item): item is NavMainItem => item != null),
    }))
    .filter((group) => group.items.length > 0);
}
