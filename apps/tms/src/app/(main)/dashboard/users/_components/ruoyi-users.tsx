"use client";

import * as React from "react";

import { Download, Plus, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/lib/session-context";

export type RuoyiUser = {
  user_id: number;
  user_name: string;
  nick_name: string;
  email: string;
  phonenumber: string;
  sex: string;
  status: string;
  dept_id: number | null;
  dept_name: string;
  remark: string | null;
  create_time: string | null;
  roles: { role_id: number; role_name: string; role_key: string }[];
};

export type RuoyiDept = { dept_id: number; dept_name: string };
export type RuoyiRoleOpt = { role_id: number; role_name: string; role_key: string };

const SEX: Record<string, string> = { "0": "男", "1": "女", "2": "未知" };
const STATUS: Record<string, string> = { "0": "正常", "1": "停用" };

const emptyForm = {
  user_name: "",
  nick_name: "",
  email: "",
  phonenumber: "",
  sex: "0",
  status: "0",
  dept_id: "",
  remark: "",
  password: "",
  role_ids: [] as number[],
};

export function RuoyiUsers({ users, depts, roles }: { users: RuoyiUser[]; depts: RuoyiDept[]; roles: RuoyiRoleOpt[] }) {
  const can = useCan();
  const [rows, setRows] = React.useState(users);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RuoyiUser | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(user: RuoyiUser) {
    setEditing(user);
    setForm({
      user_name: user.user_name,
      nick_name: user.nick_name,
      email: user.email,
      phonenumber: user.phonenumber,
      sex: user.sex,
      status: user.status,
      dept_id: user.dept_id == null ? "" : String(user.dept_id),
      remark: user.remark ?? "",
      password: "",
      role_ids: user.roles.map((r) => r.role_id),
    });
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      user_name: form.user_name,
      nick_name: form.nick_name,
      email: form.email,
      phonenumber: form.phonenumber,
      sex: form.sex,
      status: form.status,
      dept_id: form.dept_id === "" ? null : Number(form.dept_id),
      remark: form.remark,
      role_ids: form.role_ids,
      ...(editing ? {} : { password: form.password }),
    };
    const res = await fetch(editing ? `/api/system/users/${editing.user_id}` : "/api/system/users", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.detail ?? "保存失败");
      return;
    }
    setOpen(false);
    if (editing) {
      setRows((prev) => prev.map((row) => (row.user_id === data.user_id ? data : row)));
    } else {
      setRows((prev) => [...prev, data]);
    }
  }

  async function removeUser(user: RuoyiUser) {
    if (!window.confirm(`删除用户 ${user.user_name}？`)) return;
    const res = await fetch(`/api/system/users/${user.user_id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      window.alert(data.detail ?? "删除失败");
      return;
    }
    setRows((prev) => prev.filter((row) => row.user_id !== user.user_id));
  }

  async function exportUsers() {
    const res = await fetch("/api/system/users/export");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert((data as { detail?: string }).detail ?? "导出失败");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sys_user.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importUsers(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/system/users/import", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.detail ?? "导入失败");
      return;
    }
    const list = await fetch("/api/system/users");
    if (list.ok) setRows(await list.json());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户管理</CardTitle>
        <CardDescription>
          字段对齐若依 sys_user：用户名、昵称、邮箱、手机、性别、状态、部门、角色、备注、创建时间。
        </CardDescription>
        {can("system:user:add") || can("system:user:import") || can("system:user:export") ? (
          <CardAction className="flex flex-wrap gap-2">
            {can("system:user:add") ? (
              <Button size="sm" onClick={openCreate}>
                <Plus />
                新增
              </Button>
            ) : null}
            {can("system:user:import") ? (
              <>
                <input
                  ref={importRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importUsers(file);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}>
                  <Upload />
                  导入
                </Button>
              </>
            ) : null}
            {can("system:user:export") ? (
              <Button size="sm" variant="outline" onClick={() => void exportUsers()}>
                <Download />
                导出
              </Button>
            ) : null}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>昵称</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.user_name}</TableCell>
                <TableCell>{user.nick_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phonenumber}</TableCell>
                <TableCell>{SEX[user.sex] ?? user.sex}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "0" ? "default" : "secondary"}>
                    {STATUS[user.status] ?? user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.dept_name}</TableCell>
                <TableCell>{user.roles.map((r) => r.role_name).join("、")}</TableCell>
                <TableCell className="max-w-40 truncate">{user.remark}</TableCell>
                <TableCell className="whitespace-nowrap">{user.create_time}</TableCell>
                <TableCell className="text-right">
                  {can("system:user:edit") ? (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                      修改
                    </Button>
                  ) : null}
                  {can("system:user:remove") ? (
                    <Button variant="ghost" size="sm" onClick={() => void removeUser(user)}>
                      删除
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "修改用户" : "新增用户"}</DialogTitle>
            <DialogDescription>登录仍由 Better Auth 签发；本表写入 sys_user / sys_user_role。</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user_name">用户名</FieldLabel>
                <Input
                  id="user_name"
                  value={form.user_name}
                  onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nick_name">昵称</FieldLabel>
                <Input
                  id="nick_name"
                  value={form.nick_name}
                  onChange={(e) => setForm({ ...form, nick_name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phonenumber">手机</FieldLabel>
                <Input
                  id="phonenumber"
                  value={form.phonenumber}
                  maxLength={11}
                  onChange={(e) => setForm({ ...form, phonenumber: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>性别</FieldLabel>
                <Select value={form.sex} onValueChange={(sex) => setForm({ ...form, sex })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">男</SelectItem>
                    <SelectItem value="1">女</SelectItem>
                    <SelectItem value="2">未知</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>状态</FieldLabel>
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">正常</SelectItem>
                    <SelectItem value="1">停用</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>部门</FieldLabel>
                <Select
                  value={form.dept_id || "none"}
                  onValueChange={(v) => setForm({ ...form, dept_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未分配</SelectItem>
                    {depts.map((d) => (
                      <SelectItem key={d.dept_id} value={String(d.dept_id)}>
                        {d.dept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>角色</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  {roles.map((role) => (
                    <div key={role.role_id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={`role-${role.role_id}`}
                        checked={form.role_ids.includes(role.role_id)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            role_ids: checked
                              ? [...form.role_ids, role.role_id]
                              : form.role_ids.filter((id) => id !== role.role_id),
                          })
                        }
                      />
                      <label htmlFor={`role-${role.role_id}`}>{role.role_name}</label>
                    </div>
                  ))}
                </div>
              </Field>
              {!editing ? (
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </Field>
              ) : null}
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="remark">备注</FieldLabel>
                <Textarea
                  id="remark"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </Field>
            </FieldGroup>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              {can(editing ? "system:user:edit" : "system:user:add") ? (
                <Button type="submit" disabled={saving}>
                  保存
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
