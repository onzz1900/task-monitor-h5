import { redirect } from "next/navigation";

import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { toTableUser, type ApiUser } from "@/lib/tms-map";

import { Users } from "./_components/users";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (!user.permissions.includes("user:read")) redirect("/unauthorized");

  const users = await query<ApiUser>(
    `SELECT u.id, u.email, u.name, u.role AS role_code, r.name AS role_name
     FROM \`user\` u LEFT JOIN roles r ON r.code = u.role
     ORDER BY u.email`,
  );

  return <Users users={users.map(toTableUser)} />;
}
