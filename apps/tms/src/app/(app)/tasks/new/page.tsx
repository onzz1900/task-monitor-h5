"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCan } from "@/components/app-shell";
import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  const can = useCan();
  const router = useRouter();

  useEffect(() => {
    if (!can("task:create")) router.replace("/tasks");
  }, [can, router]);

  if (!can("task:create")) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl tracking-tight">登记任务</h1>
      <TaskForm />
    </div>
  );
}
