"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCan } from "@/components/app-shell";
import { TaskForm } from "@/components/task-form";
import { api } from "@/lib/client";
import type { Task } from "@/lib/types";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!can("task:update")) {
      router.replace(`/tasks/${id}`);
      return;
    }
    api<Task>(`/api/tasks/${id}`).then(setTask).catch((err) => setError(err.message));
  }, [can, id, router]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!task) return <p className="text-muted-foreground">载入中…</p>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl tracking-tight">
        修改任务 <span className="font-mono text-sm text-muted-foreground">{task.code}</span>
      </h1>
      <TaskForm task={task} />
    </div>
  );
}
