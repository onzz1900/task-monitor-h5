"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="text-5xl font-light text-primary-foreground">欢迎回来</h1>
              <p className="text-xl text-primary-foreground/80">登录以继续</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">登录</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              欢迎回来。输入邮箱和密码进入任务管理系统。
            </div>
          </div>
          <div className="space-y-4">
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
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" type="submit" disabled={busy}>
                {busy ? "登录中…" : "登录"}
              </Button>
            </form>
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">演示账号（点击直接登录）</p>
              <div className="flex flex-wrap justify-center gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <Button
                    key={a.email}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => submit(undefined, a.email, a.password)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
