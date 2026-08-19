"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TaskForm } from "@/components/task-form";
import { useCan } from "@/lib/session-context";

export default function NewTaskPage() {
  const can = useCan();
  const router = useRouter();

  useEffect(() => {
    if (!can("task:create")) router.replace("/dashboard/tasks");
  }, [can, router]);

  if (!can("task:create")) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl tracking-tight">Welcome back!</h1>
      <TaskForm />
    </div>
  );
}
