"use client";

/** 角色权限：Studio Admin 表格。 */
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/client";

type RoleRow = {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions: { code: string; name: string }[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RoleRow[]>("/api/roles").then(setRoles).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!roles) return <p className="text-muted-foreground">载入中…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl tracking-tight">角色与权限</h1>
        <p className="text-muted-foreground text-sm">管理各角色可访问的菜单与操作。</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 font-medium text-muted-foreground">角色</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">标识</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">说明</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">权限</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id} className="border-border/60 hover:bg-muted/20">
                <TableCell className="py-3 font-medium">{r.name}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-muted-foreground">{r.code}</TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{r.description}</TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map((p) => (
                      <Badge key={p.code} variant="secondary" className="rounded-sm font-normal">
                        {p.name}
                        <code className="ml-1 font-mono text-[10px] opacity-70">{p.code}</code>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
