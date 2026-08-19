/** 前端共享类型。 */

export type Bootstrap = {
  user: { id: string; email: string; name: string; role: string; role_name: string };
  permissions: string[];
  menus: { title: string; path: string; sort: number; permission_code: string }[];
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
  created_at: string;
  updated_at: string;
  last_run: Run | null;
  runs?: Run[];
};

export type Meta = {
  task_types: Record<string, string>;
  statuses: string[];
  secret_refs: { ref: string; description: string }[];
};

export const STATUS_STYLE: Record<string, string> = {
  运行中: "bg-calm-bg text-calm",
  待流转: "bg-warn-bg text-warn",
  已阻塞: "bg-hot-bg text-hot",
  本轮已完成: "bg-ok-bg text-ok",
};
