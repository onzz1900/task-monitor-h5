"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TaskForm } from "@/components/task-form";
import { api } from "@/lib/client";
import { useCan } from "@/lib/session-context";
import type { Task } from "@/lib/types";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!can("task:update")) {
      router.replace(`/dashboard/tasks/${id}`);
      return;
    }
    api<Task>(`/api/tasks/${id}`)
      .then(setTask)
      .catch((err) => setError(err.message));
  }, [can, id, router]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!task) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl tracking-tight">{task.code}</h1>
      <TaskForm task={task} />
    </div>
  );
}
