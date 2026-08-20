import { redirect } from "next/navigation";

import { hasPerm } from "@/lib/perms";
import { getSessionUser } from "@/lib/rbac";
import { listDepts, listRoles, listUsers } from "@/lib/ruoyi";

import { RuoyiUsers } from "./_components/ruoyi-users";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (user.disabled || !hasPerm(user.permissions, "system:user:list")) redirect("/unauthorized");

  const [users, depts, roles] = await Promise.all([listUsers(), listDepts(), listRoles()]);

  return (
    <RuoyiUsers
      users={users}
      depts={depts.map((d) => ({ dept_id: Number(d.dept_id), dept_name: d.dept_name }))}
      roles={roles.map((r) => ({
        role_id: Number(r.role_id),
        role_name: r.role_name,
        role_key: r.role_key,
      }))}
    />
  );
}
