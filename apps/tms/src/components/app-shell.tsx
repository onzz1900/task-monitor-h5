"use client";

/** 应用外壳：顶栏（品牌 / 皮肤切换 / 用户）+ 侧边菜单（按权限过滤）。会话由服务端布局注入。 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { authClient, getSkin, setSkin, subscribeSkin, type Skin } from "@/lib/client";
import type { Bootstrap } from "@/lib/types";

const BootstrapContext = createContext<Bootstrap | null>(null);

export function useBootstrap(): Bootstrap {
  const ctx = useContext(BootstrapContext);
  if (!ctx) throw new Error("useBootstrap 必须在 AppShell 内使用");
  return ctx;
}

export function useCan(): (perm: string) => boolean {
  const { permissions } = useBootstrap();
  return useCallback((perm: string) => permissions.includes(perm), [permissions]);
}

function SkinSwitch() {
  const skin = useSyncExternalStore(subscribeSkin, getSkin, () => "fable" as Skin);
  const change = (s: Skin) => setSkin(s);
  return (
    <div
      role="group"
      aria-label="皮肤切换"
      className="flex overflow-hidden rounded-full border border-input bg-card text-xs"
    >
      {(
        [
          ["fable", "纸票版"],
          ["console", "控制台版"],
        ] as [Skin, string][]
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => change(value)}
          className={
            "px-3 py-1.5 transition-colors " +
            (skin === value
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AppShell({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: Bootstrap;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <BootstrapContext.Provider value={initial}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5">
            <Link href="/tasks" className="flex min-w-0 items-center gap-2.5">
              <span className="font-display grid size-9 flex-none place-items-center rounded-full bg-primary text-lg font-black text-primary-foreground shadow">
                流
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <strong className="font-display truncate text-[17px]">任务流转中心</strong>
                <small className="hidden truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
                  Mission Transfer Center · TMS
                </small>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2.5">
              <SkinSwitch />
              <span className="hidden text-xs text-muted-foreground md:block">
                {initial.user.name} · {initial.user.role_name}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                退出
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 max-md:flex-col">
          <nav aria-label="主菜单" className="w-44 flex-none max-md:w-full">
            <ul className="flex flex-col gap-1 max-md:flex-row max-md:overflow-x-auto">
              {initial.menus.map((m) => {
                const active = pathname === m.path || pathname.startsWith(m.path + "/");
                return (
                  <li key={m.path}>
                    <Link
                      href={m.path}
                      className={
                        "block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground")
                      }
                    >
                      {m.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </BootstrapContext.Provider>
  );
}
