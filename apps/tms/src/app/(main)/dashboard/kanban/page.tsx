import { redirect } from "next/navigation";

import { query } from "@/lib/db";
import { hasPerm } from "@/lib/perms";
import { getSessionUser } from "@/lib/rbac";
import { serializeTask, type TaskRow } from "@/lib/tasks";
import { toKanbanBoard } from "@/lib/tms-map";
import type { Task } from "@/lib/types";

import { Kanban } from "./_components/kanban";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/v1/login");
  if (user.disabled || !hasPerm(user.permissions, "task:read")) redirect("/unauthorized");

  const rows = await query<TaskRow>("SELECT * FROM tasks ORDER BY (next_run_at IS NULL), next_run_at");
  const tasks = await Promise.all(rows.map(async (row) => (await serializeTask(row)) as Task));

  return (
    <div data-content-padding="false">
      <Kanban initialBoard={toKanbanBoard(tasks)} />
    </div>
  );
}
