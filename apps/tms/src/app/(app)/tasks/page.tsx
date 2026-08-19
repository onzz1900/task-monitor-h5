import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/task-board";
import { db } from "@/lib/db";
import { SECRET_REFS, STATUSES, TASK_TYPES } from "@/lib/meta";
import { getSessionUser } from "@/lib/rbac";
import { serializeTask, type TaskRow } from "@/lib/tasks";
import type { Meta, Task } from "@/lib/types";

export default async function TasksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.permissions.includes("task:read")) {
    return <p className="text-destructive">缺少权限：task:read</p>;
  }

  const rows = db()
    .prepare("SELECT * FROM tasks ORDER BY next_run_at IS NULL, next_run_at")
    .all() as TaskRow[];
  const initialTasks = rows.map((r) => serializeTask(r)) as Task[];
  const meta: Meta = {
    task_types: TASK_TYPES,
    statuses: [...STATUSES],
    secret_refs: [...SECRET_REFS],
  };

  return <TaskBoard initialTasks={initialTasks} meta={meta} />;
}
