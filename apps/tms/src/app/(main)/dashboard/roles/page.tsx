import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { toTableRole, type ApiRole } from "@/lib/tms-map";

import { Roles } from "./_components/roles";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (!user.permissions.includes("role:read")) redirect("/unauthorized");

  const roles = db().prepare("SELECT id, code, name, description FROM roles ORDER BY id").all() as {
    id: number;
    code: string;
    name: string;
    description: string;
  }[];
  const permStmt = db().prepare(
    `SELECT p.code, p.name FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = ? ORDER BY p.id`,
  );
  const countStmt = db().prepare("SELECT COUNT(*) AS n FROM user WHERE role = ?");

  const mapped = roles.map((role) => {
    const apiRole: ApiRole = {
      ...role,
      permissions: permStmt.all(role.id) as ApiRole["permissions"],
    };
    const { n } = countStmt.get(role.code) as { n: number };
    return toTableRole(apiRole, n);
  });

  return <Roles roles={mapped} />;
}
