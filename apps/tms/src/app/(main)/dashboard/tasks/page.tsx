import { redirect } from "next/navigation";

import { query } from "@/lib/db";
import { hasPerm } from "@/lib/perms";
import { getSessionUser } from "@/lib/rbac";
import { serializeTask, type TaskRow } from "@/lib/tasks";
import { toTableTask } from "@/lib/tms-map";
import type { Task } from "@/lib/types";

import { Tasks } from "./_components/tasks";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (user.disabled || !hasPerm(user.permissions, "task:read")) redirect("/unauthorized");

  const rows = await query<TaskRow>("SELECT * FROM tasks ORDER BY (next_run_at IS NULL), next_run_at");
  const data = await Promise.all(rows.map(async (row) => toTableTask((await serializeTask(row)) as Task)));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">Here's a list of your tasks for this month!</p>
      </div>
      <Tasks data={data} />
    </div>
  );
}
