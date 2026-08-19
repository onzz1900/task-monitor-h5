"use client";

/** 点位进度环（conic-gradient），颜色随任务状态。 */
const RING_COLOR: Record<string, string> = {
  运行中: "var(--calm)",
  待流转: "var(--warn)",
  已阻塞: "var(--hot)",
  本轮已完成: "var(--ok)",
};

export function PointsRing({
  done,
  total,
  status,
  size = 64,
}: {
  done: number;
  total: number;
  status: string;
  size?: number;
}) {
  const pct = Math.round((done / Math.max(1, total)) * 100);
  const color = RING_COLOR[status] ?? "var(--calm)";
  return (
    <div
      role="img"
      aria-label={`点位进度 ${done}/${total}`}
      className="grid flex-none place-items-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${pct}%, var(--muted) 0)` }}
    >
      <div
        className="grid place-items-center rounded-full bg-card text-center leading-tight"
        style={{ width: size - 14, height: size - 14 }}
      >
        <span className="font-mono text-xs font-semibold">
          {done}/{total}
          <span className="block text-[9px] font-normal text-muted-foreground">点位</span>
        </span>
      </div>
    </div>
  );
}
