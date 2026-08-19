"use client";

/** 任务详情：运行状态、点位、下次流转、调度与运行历史。 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCan } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, fmtBJ, fmtRelative } from "@/lib/client";
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
      .then(([t, m]) => {
        setTask(t);
        setMeta(m);
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
      setError(err instanceof Error ? err.message : "运行失败");
    }
    setRunning(false);
  };

  if (error && !task) return <p className="text-destructive">{error}</p>;
  if (!task || !meta) return <p className="text-muted-foreground">载入中…</p>;

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
            <Badge className={`rounded-sm border ${STATUS_STYLE[task.status] ?? ""}`} variant="outline">
              {task.status}
            </Badge>
            <Badge className="rounded-sm bg-transparent" variant="outline">
              {meta.task_types[task.type] ?? task.type}
            </Badge>
          </div>
          <h1 className="text-3xl tracking-tight">{task.title}</h1>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        </div>
        <div className="flex gap-2">
          {can("task:update") && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/tasks/${task.id}/edit`}>修改</Link>
            </Button>
          )}
          {can("task:run") && (
            <Button size="sm" onClick={run} disabled={running}>
              {running ? "运行中…" : "运行一次"}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">下次流转</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium tracking-tight">{fmtBJ(task.next_run_at)}</div>
            <div className="text-xs text-muted-foreground">
              {fmtRelative(task.next_run_at)}
              {task.schedule_kind === "cron"
                ? ` · cron ${task.cron_expr}`
                : ` · 每 ${task.interval_minutes} 分钟`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">上次结果</CardTitle>
          </CardHeader>
          <CardContent>
            {task.last_run ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-sm ${task.last_run.ok ? STATUS_STYLE["本轮已完成"] : "border-red-500/20 bg-red-500/10 text-red-700"}`}
                  >
                    {task.last_run.ok ? "成功" : "失败"}
                  </Badge>
                  <span className="text-sm">{task.last_run.result_text.replace(/^(成功|失败)\s*·\s*/, "")}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtBJ(task.last_run.ran_at)} · 耗时 {(task.last_run.duration_ms / 1000).toFixed(0)} 秒
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">尚未运行</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">点位</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium tracking-tight">
              {task.points_done}/{task.points_total}
            </div>
            <p className="text-sm text-muted-foreground">{task.points_note || "无点位说明"}</p>
            <p className="text-xs text-muted-foreground">
              {[task.channel, task.owner_name && `负责人 ${task.owner_name}`].filter(Boolean).join(" · ")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>调度与回调</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <p>
            调度：
            {task.schedule_kind === "cron" ? (
              <code className="font-mono">{task.cron_expr}</code>
            ) : (
              `每 ${task.interval_minutes} 分钟`
            )}
            <span className="text-muted-foreground">（{task.timezone}）</span>
          </p>
          <p>
            运行备份：<b>最近 {task.keep_runs} 次</b>
          </p>
          {task.callback_url ? (
            <>
              <p className="truncate">
                回调：<code className="font-mono text-xs">{task.callback_url}</code>
              </p>
              <p className="text-muted-foreground">
                超时 {task.callback_timeout_ms}ms · 重试 {task.callback_retries} 次
                {task.callback_secret_ref && (
                  <>
                    {" · "}密钥引用 <code className="font-mono text-xs">{task.callback_secret_ref}</code>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">未配置回调</p>
          )}
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <div className="border-b px-4 py-3 text-sm font-medium">运行历史（保留最近 {task.keep_runs} 次）</div>
        {task.runs?.length ? (
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 font-medium text-muted-foreground">结果</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">说明</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {task.runs.map((r) => (
                <TableRow key={r.id} className="border-border/60">
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={`rounded-sm ${r.ok ? STATUS_STYLE["本轮已完成"] : "border-red-500/20 bg-red-500/10 text-red-700"}`}
                    >
                      {r.ok ? "成功" : "失败"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-sm">
                    {r.result_text.replace(/^(成功|失败)\s*·\s*/, "")}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                    {fmtBJ(r.ran_at)} · {(r.duration_ms / 1000).toFixed(0)}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">暂无运行记录</p>
        )}
      </div>
    </div>
  );
}
