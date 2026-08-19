import { redirect } from "next/navigation";

import { asCount, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { toTableRole, type ApiRole } from "@/lib/tms-map";

import { Roles } from "./_components/roles";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (!user.permissions.includes("role:read")) redirect("/unauthorized");

  const roles = await query<{
    id: number;
    code: string;
    name: string;
    description: string;
  }>("SELECT id, code, name, description FROM roles ORDER BY id");

  const mapped = [];
  for (const role of roles) {
    const permissions = await query<ApiRole["permissions"][number]>(
      `SELECT p.code, p.name FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ? ORDER BY p.id`,
      [role.id],
    );
    const countRow = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM `user` WHERE role = ?", [role.code]);
    mapped.push(toTableRole({ ...role, permissions }, asCount(countRow?.n)));
  }

  return <Roles roles={mapped} />;
}
