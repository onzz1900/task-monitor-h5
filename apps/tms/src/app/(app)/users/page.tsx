"use client";

/** 用户管理：查看用户及其角色；有 user:manage 权限时可改角色。 */
import { useEffect, useState } from "react";
import { useBootstrap, useCan } from "@/components/app-shell";
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
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="font-display text-xl font-black">用户管理</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name}
                  {u.id === me.id && <span className="ml-1.5 text-xs text-muted-foreground">（我）</span>}
                </TableCell>
                <TableCell className="font-mono text-xs">{u.email}</TableCell>
                <TableCell>
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
                    u.role_name
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
