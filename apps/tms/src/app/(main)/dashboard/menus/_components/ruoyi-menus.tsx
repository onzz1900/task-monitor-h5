"use client";

import * as React from "react";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";

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

export type MenuRow = {
  menu_id: number;
  menu_name: string;
  parent_id: number;
  order_num: number;
  path: string;
  menu_type: string;
  visible: string;
  status: string;
  perms: string;
};

export type MenuNode = MenuRow & { children: MenuNode[] };

const TYPE: Record<string, string> = { M: "目录", C: "菜单", F: "按钮" };

function flatten(nodes: MenuNode[], depth = 0, acc: (MenuRow & { depth: number })[] = []) {
  for (const node of nodes) {
    acc.push({ ...node, depth });
    flatten(node.children, depth + 1, acc);
  }
  return acc;
}

const emptyForm = {
  menu_name: "",
  parent_id: "0",
  order_num: "0",
  path: "",
  menu_type: "C",
  visible: "0",
  perms: "",
};

export function RuoyiMenus({ tree, rows }: { tree: MenuNode[]; rows: MenuRow[] }) {
  const can = useCan();
  const [data, setData] = React.useState(tree);
  const [flatRows, setFlatRows] = React.useState(rows);
  const [collapsed, setCollapsed] = React.useState<Set<number>>(new Set());
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MenuRow | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const visible = flatten(data).filter((row) => {
    let parent = row.parent_id;
    while (parent) {
      if (collapsed.has(parent)) return false;
      const found = flatten(data).find((item) => item.menu_id === parent);
      parent = found?.parent_id ?? 0;
    }
    return true;
  });

  function openCreate(parentId = 0) {
    setEditing(null);
    setForm({ ...emptyForm, parent_id: String(parentId) });
    setError("");
    setOpen(true);
  }

  function openEdit(row: MenuRow) {
    setEditing(row);
    setForm({
      menu_name: row.menu_name,
      parent_id: String(row.parent_id),
      order_num: String(row.order_num),
      path: row.path,
      menu_type: row.menu_type,
      visible: row.visible,
      perms: row.perms,
    });
    setError("");
    setOpen(true);
  }

  async function reload() {
    const res = await fetch("/api/system/menus");
    const json = await res.json();
    if (res.ok) {
      setData(json.tree);
      setFlatRows(json.rows);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      menu_name: form.menu_name,
      parent_id: Number(form.parent_id),
      order_num: Number(form.order_num),
      path: form.path,
      menu_type: form.menu_type,
      visible: form.visible,
      perms: form.perms,
    };
    const res = await fetch(editing ? `/api/system/menus/${editing.menu_id}` : "/api/system/menus", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.detail ?? "保存失败");
      return;
    }
    setOpen(false);
    await reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>菜单管理</CardTitle>
        <CardDescription>字段对齐若依 sys_menu：菜单名、路由、类型、权限标识、排序、可见。树表结构。</CardDescription>
        {can("system:menu:add") ? (
          <CardAction>
            <Button size="sm" onClick={() => openCreate(0)}>
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
              <TableHead>菜单名</TableHead>
              <TableHead>路由</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>权限标识</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>可见</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const hasChildren = flatten(data).some((item) => item.parent_id === row.menu_id);
              return (
                <TableRow key={row.menu_id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1" style={{ paddingLeft: row.depth * 16 }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          className="text-muted-foreground"
                          onClick={() => {
                            const next = new Set(collapsed);
                            if (next.has(row.menu_id)) next.delete(row.menu_id);
                            else next.add(row.menu_id);
                            setCollapsed(next);
                          }}
                        >
                          {collapsed.has(row.menu_id) ? (
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-block w-4" />
                      )}
                      {row.menu_name}
                    </span>
                  </TableCell>
                  <TableCell>{row.path}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TYPE[row.menu_type] ?? row.menu_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{row.perms}</code>
                  </TableCell>
                  <TableCell>{row.order_num}</TableCell>
                  <TableCell>{row.visible === "0" ? "显示" : "隐藏"}</TableCell>
                  <TableCell className="text-right">
                    {can("system:menu:add") ? (
                      <Button variant="ghost" size="sm" onClick={() => openCreate(row.menu_id)}>
                        新增
                      </Button>
                    ) : null}
                    {can("system:menu:edit") ? (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        修改
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "修改菜单" : "新增菜单"}</DialogTitle>
            <DialogDescription>类型 M 目录 / C 菜单 / F 按钮，与官方 sys_menu.menu_type 一致。</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="menu_name">菜单名</FieldLabel>
                <Input
                  id="menu_name"
                  value={form.menu_name}
                  onChange={(e) => setForm({ ...form, menu_name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>上级菜单</FieldLabel>
                <Select value={form.parent_id} onValueChange={(parent_id) => setForm({ ...form, parent_id })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">无</SelectItem>
                    {flatRows
                      .filter((r) => r.menu_type !== "F" && r.menu_id !== editing?.menu_id)
                      .map((r) => (
                        <SelectItem key={r.menu_id} value={String(r.menu_id)}>
                          {r.menu_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>类型</FieldLabel>
                <Select value={form.menu_type} onValueChange={(menu_type) => setForm({ ...form, menu_type })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">目录</SelectItem>
                    <SelectItem value="C">菜单</SelectItem>
                    <SelectItem value="F">按钮</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="path">路由</FieldLabel>
                <Input id="path" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="perms">权限标识</FieldLabel>
                <Input id="perms" value={form.perms} onChange={(e) => setForm({ ...form, perms: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="order_num">排序</FieldLabel>
                <Input
                  id="order_num"
                  type="number"
                  value={form.order_num}
                  onChange={(e) => setForm({ ...form, order_num: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>可见</FieldLabel>
                <Select value={form.visible} onValueChange={(visible) => setForm({ ...form, visible })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">显示</SelectItem>
                    <SelectItem value="1">隐藏</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
