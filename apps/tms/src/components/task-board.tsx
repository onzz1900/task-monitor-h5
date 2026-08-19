"use client";

/** 任务列表交互：筛选与登记入口。数据由服务端页面注入，避免整页卡在「载入中」。 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCan } from "@/components/app-shell";
import { PointsRing } from "@/components/points-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtBJ, fmtRelative } from "@/lib/client";
import { STATUS_STYLE, type Meta, type Task } from "@/lib/types";

const FILTERS = ["全部", "运行中", "待流转", "已阻塞", "本轮已完成"];

export function TaskBoard({ initialTasks, meta }: { initialTasks: Task[]; meta: Meta }) {
  const can = useCan();
  const [filter, setFilter] = useState("全部");
  const tasks = initialTasks;

  const stats = useMemo(() => {
    const by = (s: string) => tasks.filter((t) => t.status === s).length;
    return [
      ["运行中", by("运行中"), "text-calm", "border-l-calm"],
      ["待流转", by("待流转"), "text-warn", "border-l-warn"],
      ["已阻塞", by("已阻塞"), "text-hot", "border-l-hot"],
      ["本轮已完成", by("本轮已完成"), "text-ok", "border-l-ok"],
    ] as const;
  }, [tasks]);

  const visible = useMemo(
    () => tasks.filter((t) => filter === "全部" || t.status === filter),
    [tasks, filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="流转统计" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, n, color, border]) => (
          <article key={label} className={`rounded-xl border border-l-4 bg-card px-4 py-3 shadow-sm ${border}`}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`font-display text-3xl font-black ${color}`}>{n}</div>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display mr-auto text-lg font-bold">任务清单</h1>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-card text-muted-foreground hover:bg-muted")
            }
          >
            {f}
          </button>
        ))}
        {can("task:create") && (
          <Button asChild size="sm" className="ml-1">
            <Link href="/tasks/new">＋ 登记任务</Link>
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-3.5">
        {visible.map((t) => (
          <li key={t.id}>
            <Link
              href={`/tasks/${t.id}`}
              className="grid overflow-hidden rounded-2xl border bg-card shadow-sm transition-transform hover:-translate-y-0.5 md:grid-cols-[1fr_200px]"
            >
              <div className="flex items-center gap-4 p-4">
                <PointsRing done={t.points_done} total={t.points_total} status={t.status} />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{t.code}</span>
                    <Badge className={`border-0 ${STATUS_STYLE[t.status] ?? ""}`}>{t.status}</Badge>
                    <span className="rounded-full border border-dashed border-input px-2 py-0.5 text-[11px] text-muted-foreground">
                      {meta.task_types[t.type] ?? t.type}
                    </span>
                  </div>
                  <h2 className="font-display truncate text-[17px] font-bold">{t.title}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {[t.channel, t.owner_name].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-baseline gap-2 text-xs">
                    {t.last_run ? (
                      <>
                        <span
                          className={`rounded px-1.5 py-px font-bold ${
                            t.last_run.ok ? "bg-ok-bg text-ok" : "bg-hot-bg text-hot"
                          }`}
                        >
                          {t.last_run.ok ? "成功" : "失败"}
                        </span>
                        <span className="truncate">
                          {t.last_run.result_text.replace(/^(成功|失败)\s*·\s*/, "")}
                        </span>
                        <span className="text-muted-foreground">上次运行 {fmtBJ(t.last_run.ran_at)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">尚未运行</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-0.5 border-dashed border-input bg-muted/60 px-4 py-3 max-md:border-t md:border-l-2">
                <span className="text-[10px] tracking-[0.12em] text-muted-foreground">下次流转</span>
                <span className="font-display text-lg font-black text-primary">{fmtBJ(t.next_run_at)}</span>
                <span className="text-xs text-muted-foreground">{fmtRelative(t.next_run_at)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="py-8 text-center text-muted-foreground">该筛选条件下暂无任务。</p>}
    </div>
  );
}
