"use client";

/** 角色权限：每个角色可用的权限一览。 */
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="font-display text-xl font-black">角色权限</h1>
      <div className="grid gap-4">
        {roles.map((r) => (
          <Card key={r.id} className="py-4">
            <CardHeader className="px-5">
              <CardTitle className="font-display flex items-baseline gap-2">
                {r.name}
                <code className="font-mono text-xs font-normal text-muted-foreground">{r.code}</code>
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 px-5">
              {r.permissions.map((p) => (
                <Badge key={p.code} variant="secondary" className="font-normal">
                  {p.name} <code className="ml-1 font-mono text-[10px] opacity-70">{p.code}</code>
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
