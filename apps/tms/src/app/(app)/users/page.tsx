"use client";

/** 用户管理：Studio Admin 表格。有 user:manage 时可改角色。 */
import { useEffect, useState } from "react";
import { useBootstrap, useCan } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/client";

type UserRow = { id: string; email: string; name: string; role_code: string; role_name: string };
type RoleRow = { id: number; code: string; name: string };

export default function UsersPage() {
  const can = useCan();
  const { user: me } = useBootstrap();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<UserRow[]>("/api/users").then(setUsers).catch((err) => setError(err.message));
    if (can("role:read")) {
      api<RoleRow[]>("/api/roles").then(setRoles).catch(() => {});
    }
  }, [can]);

  const changeRole = async (id: string, role: string) => {
    setError(null);
    try {
      const updated = await api<UserRow>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((list) => list?.map((u) => (u.id === id ? updated : u)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败");
    }
  };

  if (error && !users) return <p className="text-destructive">{error}</p>;
  if (!users) return <p className="text-muted-foreground">载入中…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl leading-none">用户</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            管理组织成员及其角色权限。
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{users.length} 人</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {error && <p className="px-4 pb-2 text-sm text-destructive">{error}</p>}
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 font-medium text-muted-foreground">姓名</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">邮箱</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">角色</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-border/60 hover:bg-muted/20">
                  <TableCell className="py-3 font-medium">
                    {u.name}
                    {u.id === me.id && <span className="ml-1.5 text-xs text-muted-foreground">（我）</span>}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="py-3">
                    {can("user:manage") && roles.length ? (
                      <Select value={u.role_code} onValueChange={(v) => changeRole(u.id, v)}>
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="rounded-sm">
                        {u.role_name}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
