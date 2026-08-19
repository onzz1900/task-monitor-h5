"use client";

import * as React from "react";

import Link from "next/link";

import { Plus } from "lucide-react";

import { MenuPermTree, type MenuTreeItem } from "@/app/(main)/dashboard/_components/ruoyi/menu-perm-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCan } from "@/lib/session-context";

export type RuoyiRole = {
  role_id: number;
  role_name: string;
  role_key: string;
  role_sort: number;
  status: string;
  remark: string | null;
  menu_ids: number[];
};

export function RuoyiRoles({ roles, menuTree }: { roles: RuoyiRole[]; menuTree: MenuTreeItem[] }) {
  const can = useCan();
  const [rows, setRows] = React.useState(roles);
  const [editOpen, setEditOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<RuoyiRole | null>(null);
  const [form, setForm] = React.useState({ role_name: "", role_key: "", role_sort: "0", status: "0" });
  const [menuIds, setMenuIds] = React.useState<number[]>([]);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function openCreate() {
    setCurrent(null);
    setForm({ role_name: "", role_key: "", role_sort: String(rows.length + 1), status: "0" });
    setMenuIds([]);
    setError("");
    setEditOpen(true);
  }

  function openEdit(role: RuoyiRole) {
    setCurrent(role);
    setForm({
      role_name: role.role_name,
      role_key: role.role_key,
      role_sort: String(role.role_sort),
      status: role.status,
    });
    setMenuIds(role.menu_ids);
    setError("");
    setEditOpen(true);
  }

  function openAuth(role: RuoyiRole) {
    setCurrent(role);
    setMenuIds(role.menu_ids);
    setError("");
    setAuthOpen(true);
  }

  async function saveRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      role_name: form.role_name,
      role_key: form.role_key,
      role_sort: Number(form.role_sort),
      status: form.status,
      menu_ids: menuIds,
    };
    const res = await fetch(current ? `/api/system/roles/${current.role_id}` : "/api/system/roles", {
      method: current ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.detail ?? "保存失败");
      return;
    }
    setEditOpen(false);
    if (current) {
      setRows((prev) => prev.map((row) => (row.role_id === data.role_id ? { ...row, ...data } : row)));
    } else {
      setRows((prev) => [...prev, data]);
    }
  }

  async function saveAuth() {
    if (!current) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/system/roles/${current.role_id}/menus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu_ids: menuIds }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.detail ?? "授权失败");
      return;
    }
    setRows((prev) => prev.map((row) => (row.role_id === current.role_id ? { ...row, menu_ids: data.menu_ids } : row)));
    setAuthOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>角色管理</CardTitle>
        <CardDescription>
          字段对齐若依 sys_role：角色名、权限字符、排序、状态。菜单权限写入 sys_role_menu。
          {can("system:menu:list") ? (
            <>
              {" "}
              <Link href="/dashboard/menus" className="underline underline-offset-4">
                菜单管理
              </Link>
            </>
          ) : null}
        </CardDescription>
        {can("system:role:add") ? (
          <CardAction>
            <Button size="sm" onClick={openCreate}>
              <Plus />
              新增
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色名</TableHead>
              <TableHead>权限字符</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((role) => (
              <TableRow key={role.role_id}>
                <TableCell>{role.role_name}</TableCell>
                <TableCell>
                  <code className="text-xs">{role.role_key}</code>
                </TableCell>
                <TableCell>{role.role_sort}</TableCell>
                <TableCell>
                  <Badge variant={role.status === "0" ? "default" : "secondary"}>
                    {role.status === "0" ? "正常" : "停用"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {can("system:role:edit") ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                        修改
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openAuth(role)}>
                        菜单权限
                      </Button>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{current ? "修改角色" : "新增角色"}</DialogTitle>
            <DialogDescription>保存时可同时勾选菜单权限树。</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveRole} className="space-y-4">
            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="role_name">角色名</FieldLabel>
                <Input
                  id="role_name"
                  value={form.role_name}
                  onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role_key">权限字符</FieldLabel>
                <Input
                  id="role_key"
                  value={form.role_key}
                  onChange={(e) => setForm({ ...form, role_key: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role_sort">排序</FieldLabel>
                <Input
                  id="role_sort"
                  type="number"
                  value={form.role_sort}
                  onChange={(e) => setForm({ ...form, role_sort: e.target.value })}
                />
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
            </FieldGroup>
            <Field>
              <FieldLabel>菜单权限</FieldLabel>
              <MenuPermTree tree={menuTree} selected={menuIds} onSelectedChange={setMenuIds} />
            </Field>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>菜单权限 — {current?.role_name}</DialogTitle>
            <DialogDescription>勾选写入 sys_role_menu，权限标识来自 sys_menu.perms。</DialogDescription>
          </DialogHeader>
          <MenuPermTree tree={menuTree} selected={menuIds} onSelectedChange={setMenuIds} />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAuthOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={saveAuth}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
