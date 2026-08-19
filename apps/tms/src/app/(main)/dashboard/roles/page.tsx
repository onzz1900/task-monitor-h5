import { redirect } from "next/navigation";

import { hasPerm } from "@/lib/perms";
import { getSessionUser } from "@/lib/rbac";
import { buildMenuTree, listMenus, listRoles, menuIdsForRole, serializeMenuTree, serializeRole } from "@/lib/ruoyi";

import { RuoyiRoles } from "./_components/ruoyi-roles";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (!hasPerm(user.permissions, "system:role:list")) redirect("/unauthorized");

  const roles = await listRoles();
  const mapped = [];
  for (const role of roles) {
    mapped.push(serializeRole(role, await menuIdsForRole(Number(role.role_id))));
  }
  const tree = serializeMenuTree(buildMenuTree(await listMenus()));

  return <RuoyiRoles roles={mapped} menuTree={tree} />;
}
