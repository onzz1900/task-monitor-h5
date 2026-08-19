"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, fmtBJ, fmtRelative } from "@/lib/client";
import { useCan } from "@/lib/session-context";
import { STATUS_STYLE, type Meta, type Task } from "@/lib/types";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const [task, setTask] = useState<Task | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => {
    Promise.all([api<Task>(`/api/tasks/${id}`), api<Meta>("/api/meta")])
      .then(([nextTask, nextMeta]) => {
        setTask(nextTask);
        setMeta(nextMeta);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(load, [load]);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setTask(await api<Task>(`/api/tasks/${id}/run`, { method: "POST" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    }
    setRunning(false);
  };

  if (error && !task) return <p className="text-destructive">{error}</p>;
  if (!task || !meta) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-muted-foreground text-xs">{task.code}</span>
            <Badge className={`rounded-sm border ${STATUS_STYLE[task.status] ?? ""}`} variant="outline">
              {task.status}
            </Badge>
            <Badge className="rounded-sm bg-transparent" variant="outline">
              {meta.task_types[task.type] ?? task.type}
            </Badge>
          </div>
          <h1 className="text-3xl tracking-tight">{task.title}</h1>
          {task.description ? <p className="text-muted-foreground text-sm">{task.description}</p> : null}
        </div>
        <div className="flex gap-2">
          {can("task:update") ? (
            <Button asChild size="sm" variant="outline">
              <Link prefetch={false} href={`/dashboard/tasks/${task.id}/edit`}>
                Edit
              </Link>
            </Button>
          ) : null}
          {can("task:run") ? (
            <Button size="sm" disabled={running} onClick={run}>
              {running ? "Running…" : "Run"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-xs tracking-wide">Next run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-2xl tracking-tight">{fmtBJ(task.next_run_at)}</div>
            <div className="text-muted-foreground text-xs">
              {fmtRelative(task.next_run_at)}
              {task.schedule_kind === "cron" ? ` · cron ${task.cron_expr}` : ` · every ${task.interval_minutes} min`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-xs tracking-wide">Last result</CardTitle>
          </CardHeader>
          <CardContent>
            {task.last_run ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`rounded-sm ${task.last_run.ok ? STATUS_STYLE["本轮已完成"] : "border-red-500/20 bg-red-500/10 text-red-700"}`}
                    variant="outline"
                  >
                    {task.last_run.ok ? "Done" : "Failed"}
                  </Badge>
                  <span className="text-sm">{task.last_run.result_text.replace(/^(成功|失败)\s*·\s*/, "")}</span>
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {fmtBJ(task.last_run.ran_at)} · {(task.last_run.duration_ms / 1000).toFixed(0)}s
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No runs yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-xs tracking-wide">Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-2xl tracking-tight">
              {task.points_done}/{task.points_total}
            </div>
            <p className="text-muted-foreground text-sm">{task.points_note || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <div className="border-b px-4 py-3 font-medium text-sm">Run history</div>
        {task.runs?.length ? (
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">Title</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {task.runs.map((runRow) => (
                <TableRow key={runRow.id} className="border-border/60">
                  <TableCell className="py-3">
                    <Badge
                      className={`rounded-sm ${runRow.ok ? STATUS_STYLE["本轮已完成"] : "border-red-500/20 bg-red-500/10 text-red-700"}`}
                      variant="outline"
                    >
                      {runRow.ok ? "Done" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-sm">{runRow.result_text.replace(/^(成功|失败)\s*·\s*/, "")}</TableCell>
                  <TableCell className="py-3 font-mono text-muted-foreground text-xs">
                    {fmtBJ(runRow.ran_at)} · {(runRow.duration_ms / 1000).toFixed(0)}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">No results.</p>
        )}
      </div>
    </div>
  );
}
