"use client";

/** 任务列表：Studio Admin 表格（筛选、列、行操作）。数据由服务端注入。 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleCheck, CircleDashed, CirclePause, Loader, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { useCan } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, fmtBJ } from "@/lib/client";
import { STATUS_STYLE, type Meta, type Task } from "@/lib/types";

const FILTERS = ["全部", "运行中", "待流转", "已阻塞", "本轮已完成"] as const;

const STATUS_ICON: Record<string, typeof Loader> = {
  运行中: Loader,
  待流转: CircleDashed,
  已阻塞: CirclePause,
  本轮已完成: CircleCheck,
};

function lastResultText(task: Task): string {
  if (!task.last_run) return "尚未运行";
  return task.last_run.result_text.replace(/^(成功|失败)\s*·\s*/, "");
}

export function TaskBoard({ initialTasks, meta }: { initialTasks: Task[]; meta: Meta }) {
  const can = useCan();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("全部");
  const [query, setQuery] = useState("");
  const [runningId, setRunningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter !== "全部" && t.status !== filter) return false;
      if (!q) return true;
      const hay = [t.code, t.title, t.owner_name, t.channel, meta.task_types[t.type] ?? t.type]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tasks, filter, query, meta.task_types]);

  const run = async (id: number) => {
    setRunningId(id);
    setError(null);
    try {
      const updated = await api<Task>(`/api/tasks/${id}/run`, { method: "POST" });
      setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "运行失败");
    }
    setRunningId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">欢迎回来</h2>
        <p className="text-muted-foreground">本月任务清单：点位、下次流转与上次结果。</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <div className="border-b px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="筛选任务…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-background pl-8"
                />
              </div>
              {FILTERS.map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
              {(filter !== "全部" || query) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setFilter("全部");
                    setQuery("");
                  }}
                >
                  <X data-icon="inline-start" />
                  重置
                </Button>
              )}
            </div>
            {can("task:create") && (
              <Button asChild size="sm">
                <Link href="/tasks/new">
                  <Plus data-icon="inline-start" />
                  登记任务
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 font-medium text-muted-foreground">编号</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">标题</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">状态</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">点位</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">下次流转</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">上次结果</TableHead>
              <TableHead className="h-11 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((t) => {
                const StatusIcon = STATUS_ICON[t.status] ?? CircleDashed;
                return (
                  <TableRow key={t.id} className="border-border/60 hover:bg-muted/20">
                    <TableCell className="py-3 font-mono text-sm text-muted-foreground">{t.code}</TableCell>
                    <TableCell className="py-3 align-middle">
                      <Link href={`/tasks/${t.id}`} className="flex min-w-0 items-center gap-2">
                        <Badge className="rounded-sm bg-transparent" variant="outline">
                          {meta.task_types[t.type] ?? t.type}
                        </Badge>
                        <span className="max-w-lg truncate font-medium text-sm">{t.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={`gap-1.5 rounded-sm border font-medium ${STATUS_STYLE[t.status] ?? ""}`}
                        variant="outline"
                      >
                        <StatusIcon className="size-3.5" />
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-sm">
                      <div className="font-medium">
                        {t.points_done}/{t.points_total}
                      </div>
                      {t.points_note && (
                        <div className="max-w-48 truncate text-xs text-muted-foreground">{t.points_note}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-sm">
                      <div>{fmtBJ(t.next_run_at)}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm">
                      {t.last_run ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`rounded-sm ${t.last_run.ok ? STATUS_STYLE["本轮已完成"] : "border-red-500/20 bg-red-500/10 text-red-700"}`}
                          >
                            {t.last_run.ok ? "成功" : "失败"}
                          </Badge>
                          <span className="max-w-56 truncate text-muted-foreground">{lastResultText(t)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">尚未运行</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                            <MoreHorizontal />
                            <span className="sr-only">打开菜单</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/tasks/${t.id}`}>查看</Link>
                          </DropdownMenuItem>
                          {can("task:update") && (
                            <DropdownMenuItem asChild>
                              <Link href={`/tasks/${t.id}/edit`}>修改</Link>
                            </DropdownMenuItem>
                          )}
                          {can("task:run") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={runningId === t.id}
                                onSelect={() => run(t.id)}
                              >
                                {runningId === t.id ? "运行中…" : "运行一次"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  该筛选条件下暂无任务。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          共 {visible.length} 条 / {tasks.length} 条任务
        </div>
      </div>
    </div>
  );
}
