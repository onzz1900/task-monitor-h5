"use client";

/** 任务详情：最近运行 / 下次流转 / 点位 / 调度与回调配置 / 运行历史（备份最近 N 次）。 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCan } from "@/components/app-shell";
import { PointsRing } from "@/components/points-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
        <Badge className={`border-0 ${STATUS_STYLE[task.status] ?? ""}`}>{task.status}</Badge>
        <span className="rounded-full border border-dashed border-input px-2 py-0.5 text-[11px] text-muted-foreground">
          {meta.task_types[task.type] ?? task.type}
        </span>
        <span className="ml-auto flex gap-2">
          {can("task:update") && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/tasks/${task.id}/edit`}>修改</Link>
            </Button>
          )}
          {can("task:run") && (
            <Button size="sm" onClick={run} disabled={running}>
              {running ? "运行中…" : "▶ 运行一次"}
            </Button>
          )}
        </span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-black">{task.title}</h1>
        {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-normal tracking-widest text-muted-foreground">
              下次流转（北京时间）
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="font-display text-2xl font-black text-primary">{fmtBJ(task.next_run_at)}</div>
            <div className="text-xs text-muted-foreground">
              {fmtRelative(task.next_run_at)}
              {task.schedule_kind === "cron"
                ? ` · cron ${task.cron_expr}`
                : ` · 每 ${task.interval_minutes} 分钟`}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-normal tracking-widest text-muted-foreground">
              最近一次运行
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {task.last_run ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-px text-sm font-bold ${
                      task.last_run.ok ? "bg-ok-bg text-ok" : "bg-hot-bg text-hot"
                    }`}
                  >
                    {task.last_run.ok ? "成功" : "失败"}
                  </span>
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
      </div>

      <Card className="py-4">
        <CardContent className="flex items-center gap-4 px-4">
          <PointsRing done={task.points_done} total={task.points_total} status={task.status} size={58} />
          <div className="min-w-0">
            <div className="text-xs tracking-widest text-muted-foreground">点位进度</div>
            <p className="text-sm">{task.points_note || `${task.points_done}/${task.points_total} 点位`}</p>
            <p className="text-xs text-muted-foreground">
              {[task.channel, task.owner_name && `负责人 ${task.owner_name}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-xs font-normal tracking-widest text-muted-foreground">
            调度与回调
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-1.5 px-4 text-sm sm:grid-cols-2">
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

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-xs font-normal tracking-widest text-muted-foreground">
            运行历史（保留最近 {task.keep_runs} 次）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {task.runs?.length ? (
            <ul className="divide-y">
              {task.runs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
                  <span
                    className={`rounded px-1.5 py-px text-xs font-bold ${
                      r.ok ? "bg-ok-bg text-ok" : "bg-hot-bg text-hot"
                    }`}
                  >
                    {r.ok ? "成功" : "失败"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {r.result_text.replace(/^(成功|失败)\s*·\s*/, "")}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {fmtBJ(r.ran_at)} · {(r.duration_ms / 1000).toFixed(0)}s
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">暂无运行记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
