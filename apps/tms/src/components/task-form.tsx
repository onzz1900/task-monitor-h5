"use client";

import { useEffect, useState } from "react";

/** Shared create/edit form for list pages and Kanban. */
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
import { useCan } from "@/lib/session-context";
import type { Meta, Task } from "@/lib/types";

type TargetKind = "platform" | "business" | "other";

type FormState = {
  title: string;
  description: string;
  target_kind: TargetKind;
  target_code: string;
  type: string;
  multi_shop: boolean;
  status: string;
  remark: string;
  owner_name: string;
  channel: string;
  points_done: number;
  points_total: number;
  points_note: string;
  schedule_kind: "cron" | "interval";
  cron_expr: string;
  interval_minutes: number;
  callback_enabled: boolean;
  callback_url: string;
  callback_timeout_ms: number;
  callback_retries: number;
  callback_secret_ref: string;
  keep_runs: number;
};

function fromTask(task?: Task, defaultStatus = "待流转"): FormState {
  const kind = (task?.target_kind as TargetKind | undefined) ?? "other";
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    target_kind: kind,
    target_code: task?.target_code ?? "",
    type: task?.type ?? "review",
    multi_shop: Boolean(task?.multi_shop),
    status: task?.status ?? defaultStatus,
    remark: task?.remark ?? "",
    owner_name: task?.owner_name ?? "",
    channel: task?.channel ?? "",
    points_done: task?.points_done ?? 0,
    points_total: task?.points_total ?? 10,
    points_note: task?.points_note ?? "",
    schedule_kind: task?.schedule_kind ?? "cron",
    cron_expr: task?.cron_expr ?? "0 9 * * *",
    interval_minutes: task?.interval_minutes ?? 60,
    callback_enabled: Boolean(task?.callback_url),
    callback_url: task?.callback_url ?? "",
    callback_timeout_ms: task?.callback_timeout_ms ?? 10000,
    callback_retries: task?.callback_retries ?? 3,
    callback_secret_ref: task?.callback_secret_ref ?? "",
    keep_runs: task?.keep_runs ?? 10,
  };
}

export function TaskForm({
  task,
  defaultStatus = "待流转",
  onSaved,
  onCancel,
}: {
  task?: Task;
  defaultStatus?: string;
  onSaved?: (saved: Task) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [form, setForm] = useState<FormState>(() => fromTask(task, defaultStatus));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canSave = task ? can("task:update") : can("task:create");

  useEffect(() => {
    api<Meta>("/api/meta")
      .then(setMeta)
      .catch((err) => setError(err.message));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      type: form.target_kind === "other" ? form.type : form.type || "review",
      status: form.status,
      target_kind: form.target_kind,
      target_code: form.target_kind === "other" ? "" : form.target_code,
      multi_shop: form.multi_shop,
      remark: form.remark,
      owner_name: form.owner_name,
      channel: form.channel,
      points_done: form.points_done,
      points_total: form.points_total,
      points_note: form.points_note,
      schedule_kind: form.schedule_kind,
      cron_expr: form.schedule_kind === "cron" ? form.cron_expr : null,
      interval_minutes: form.schedule_kind === "interval" ? form.interval_minutes : null,
      callback_url: form.callback_enabled ? form.callback_url : null,
      callback_timeout_ms: form.callback_timeout_ms,
      callback_retries: form.callback_retries,
      callback_secret_ref: form.callback_enabled && form.callback_secret_ref ? form.callback_secret_ref : null,
      keep_runs: form.keep_runs,
    };
    try {
      const saved = task
        ? await api<Task>(`/api/tasks/${task.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await api<Task>("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
      if (onSaved) {
        onSaved(saved);
        setBusy(false);
        return;
      }
      router.push(`/dashboard/tasks/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setBusy(false);
    }
  };

  if (!meta) return <p className="text-muted-foreground">{error ?? "载入中…"}</p>;

  const cascadeOptions = form.target_kind === "platform" ? meta.platforms : meta.business_systems;

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="title">任务名称 *</Label>
            <Input id="title" required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="desc">描述</Label>
            <Textarea
              id="desc"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>类型 *</Label>
            <Select
              value={form.target_kind}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  target_kind: v as TargetKind,
                  target_code: "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(meta.target_kinds).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.target_kind === "other" ? (
            <div className="grid gap-1.5">
              <Label>采集 / 监控 / 报表</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(meta.task_types).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label>{form.target_kind === "platform" ? "平台 *" : "业务系统 *"}</Label>
              <Select value={form.target_code} onValueChange={(v) => set("target_code", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {cascadeOptions.map((row) => (
                    <SelectItem key={row.code} value={row.code}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="multi_shop"
              checked={form.multi_shop}
              onCheckedChange={(checked) => set("multi_shop", checked === true)}
            />
            <Label htmlFor="multi_shop">是否多店铺</Label>
          </div>
          <div className="grid gap-1.5">
            <Label>状态 *</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meta.statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea id="remark" rows={2} value={form.remark} onChange={(e) => set("remark", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>更多</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="owner">负责人</Label>
            <Input id="owner" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="channel">渠道 / 范围</Label>
            <Input
              id="channel"
              placeholder="如：天猫 + 京东"
              value={form.channel}
              onChange={(e) => set("channel", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-done">已完成点位</Label>
            <Input
              id="p-done"
              type="number"
              min={0}
              value={form.points_done}
              onChange={(e) => set("points_done", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-total">总点位 *</Label>
            <Input
              id="p-total"
              type="number"
              min={1}
              required
              value={form.points_total}
              onChange={(e) => set("points_total", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="p-note">点位说明</Label>
            <Input id="p-note" value={form.points_note} onChange={(e) => set("points_note", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>调度（Asia/Shanghai）</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>调度方式</Label>
            <Select value={form.schedule_kind} onValueChange={(v) => set("schedule_kind", v as "cron" | "interval")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cron">cron 表达式</SelectItem>
                <SelectItem value="interval">固定间隔</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.schedule_kind === "cron" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="cron">cron 表达式 *</Label>
              <Input
                id="cron"
                required
                className="font-mono"
                placeholder="0 9 * * *"
                value={form.cron_expr}
                onChange={(e) => set("cron_expr", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">分 时 日 月 周，按北京时间解析</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="interval">间隔（分钟）*</Label>
              <Input
                id="interval"
                type="number"
                min={1}
                required
                value={form.interval_minutes}
                onChange={(e) => set("interval_minutes", Number(e.target.value))}
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="keep">运行备份份数（最近 N 次）</Label>
            <Input
              id="keep"
              type="number"
              min={1}
              max={100}
              value={form.keep_runs}
              onChange={(e) => set("keep_runs", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            回调（可选）
            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.callback_enabled}
                onChange={(e) => set("callback_enabled", e.target.checked)}
              />
              启用
            </label>
          </CardTitle>
        </CardHeader>
        {form.callback_enabled ? (
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="cb-url">POST 回调地址 *</Label>
              <Input
                id="cb-url"
                type="url"
                required
                placeholder="https://hooks.example.com/tms"
                value={form.callback_url}
                onChange={(e) => set("callback_url", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cb-timeout">超时（毫秒）</Label>
              <Input
                id="cb-timeout"
                type="number"
                min={100}
                max={120000}
                value={form.callback_timeout_ms}
                onChange={(e) => set("callback_timeout_ms", Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cb-retries">重试次数</Label>
              <Input
                id="cb-retries"
                type="number"
                min={0}
                max={10}
                value={form.callback_retries}
                onChange={(e) => set("callback_retries", Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>签名密钥（secretRef）</Label>
              <Select
                value={form.callback_secret_ref || "none"}
                onValueChange={(v) => set("callback_secret_ref", v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="不使用" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用</SelectItem>
                  {meta.secret_refs.map((s) => (
                    <SelectItem key={s.ref} value={s.ref}>
                      {s.ref} — {s.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">只保存引用名，密钥本体由服务端密管持有，永不下发到前端。</p>
            </div>
          </CardContent>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-3">
        {canSave ? (
          <Button type="submit" disabled={busy}>
            {busy ? "保存中…" : task ? "保存修改" : "登记任务"}
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => (onCancel ? onCancel() : router.back())}>
          取消
        </Button>
      </div>
    </form>
  );
}
