/** 前端共享类型。 */

export type Bootstrap = {
  user: { id: string; email: string; name: string; role: string; role_name: string; status: string };
  permissions: string[];
  menus: { title: string; path: string; sort: number; permission_code: string }[];
  nav: { id: number; label: string; items: { id: string; title: string; url: string }[] }[];
  disabled: boolean;
};

export type Run = {
  id: number;
  ran_at: string;
  ok: boolean;
  result_text: string;
  duration_ms: number;
};

export type Task = {
  id: number;
  code: string;
  title: string;
  description: string;
  type: string;
  status: string;
  owner_name: string;
  channel: string;
  points_done: number;
  points_total: number;
  points_note: string;
  schedule_kind: "cron" | "interval";
  cron_expr: string | null;
  interval_minutes: number | null;
  timezone: string;
  next_run_at: string | null;
  callback_url: string | null;
  callback_timeout_ms: number;
  callback_retries: number;
  callback_secret_ref: string | null;
  keep_runs: number;
  target_kind: "platform" | "business" | "other";
  target_code: string;
  multi_shop: boolean;
  remark: string;
  created_at: string;
  updated_at: string;
  last_run: Run | null;
  runs?: Run[];
};

export type Meta = {
  task_types: Record<string, string>;
  statuses: string[];
  secret_refs: { ref: string; description: string }[];
  target_kinds: Record<string, string>;
  platforms: { kind: string; code: string; label: string; sort: number }[];
  business_systems: { kind: string; code: string; label: string; sort: number }[];
};

export const STATUS_STYLE: Record<string, string> = {
  运行中: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  待流转: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  已阻塞: "border-muted-foreground/20 bg-muted text-muted-foreground",
  本轮已完成: "border-green-500/20 bg-green-500/10 text-green-700",
};
