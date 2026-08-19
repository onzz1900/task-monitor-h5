"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/client";

const DEMO_ACCOUNTS = [
  { email: "admin@tms.local", password: "admin123", label: "管理员" },
  { email: "duty@tms.local", password: "duty123", label: "值班" },
  { email: "readonly@tms.local", password: "read123", label: "只读" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent, em?: string, pw?: string) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({
      email: em ?? email,
      password: pw ?? password,
    });
    if (err) {
      setBusy(false);
      setError(err.message ?? "登录失败，请检查邮箱与密码");
      return;
    }
    router.replace("/tasks");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="font-display grid size-11 place-items-center rounded-full bg-primary text-xl font-black text-primary-foreground shadow">
            流
          </span>
          <div className="leading-tight">
            <div className="font-display text-xl font-black">任务流转中心</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Mission Transfer Center · TMS
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">登录</CardTitle>
            <CardDescription>电商采集、监控与报表任务的管理系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tms.local"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy}>
                {busy ? "登录中…" : "登录"}
              </Button>
            </form>

            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs text-muted-foreground">演示账号（点击直接登录）：</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={busy}
                    onClick={() => submit(undefined, a.email, a.password)}
                    className="rounded-full border border-input bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {a.label} · {a.email}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
