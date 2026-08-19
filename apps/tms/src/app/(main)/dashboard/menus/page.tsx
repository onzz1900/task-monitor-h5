import { redirect } from "next/navigation";

import { hasPerm } from "@/lib/perms";
import { getSessionUser } from "@/lib/rbac";
import { buildMenuTree, listMenus, serializeMenu, serializeMenuTree } from "@/lib/ruoyi";

import { RuoyiMenus } from "./_components/ruoyi-menus";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (user.disabled || !hasPerm(user.permissions, "system:menu:list")) redirect("/unauthorized");

  const menus = await listMenus();
  const rows = menus.map(serializeMenu);
  const tree = serializeMenuTree(buildMenuTree(menus));

  return <RuoyiMenus tree={tree} rows={rows} />;
}
