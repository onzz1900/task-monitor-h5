"use client";

/** Studio Admin 外壳：可折叠侧栏 + 顶栏。菜单按权限过滤。 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import {
  CheckSquare,
  Command,
  ListTodo,
  Lock,
  LogOut,
  Palette,
  PlusCircleIcon,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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

const MENU_ICON: Record<string, typeof ListTodo> = {
  "/tasks": ListTodo,
  "/users": Users,
  "/roles": Lock,
};

const SKIN_LABEL: Record<Skin, string> = {
  studio: "管理后台",
  fable: "纸票版（存档）",
  console: "控制台版（存档）",
};

function SkinMenu() {
  const skin = useSyncExternalStore(subscribeSkin, getSkin, () => "studio" as Skin);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="皮肤">
          <Palette />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>外观</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={skin} onValueChange={(v) => setSkin(v as Skin)}>
          {(Object.keys(SKIN_LABEL) as Skin[]).map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {SKIN_LABEL[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppSidebar({ initial }: { initial: Bootstrap }) {
  const pathname = usePathname();
  const can = useCan();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/tasks">
                <Command />
                <span className="font-semibold text-base">任务管理系统</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {can("task:create") && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="登记任务"
                    className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  >
                    <Link href="/tasks/new">
                      <PlusCircleIcon />
                      <span>登记任务</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>业务</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {initial.menus.map((m) => {
                const Icon = MENU_ICON[m.path] ?? CheckSquare;
                const active = pathname === m.path || pathname.startsWith(m.path + "/");
                return (
                  <SidebarMenuItem key={m.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={m.title}>
                      <Link href={m.path}>
                        <Icon />
                        <span>{m.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg px-1 py-1.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-8">
                <AvatarFallback>{initial.user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-medium">{initial.user.name}</div>
                <div className="truncate text-xs text-muted-foreground">{initial.user.role_name}</div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
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
  const current = initial.menus.find((m) => pathname === m.path || pathname.startsWith(m.path + "/"));

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <BootstrapContext.Provider value={initial}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
          } as React.CSSProperties
        }
      >
        <AppSidebar initial={initial} />
        <SidebarInset className="min-w-0 overflow-x-clip">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                />
                <span className="text-sm font-medium">{current?.title ?? "任务管理系统"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="hidden text-xs text-muted-foreground md:inline">
                  {initial.user.name} · {initial.user.role_name}
                </span>
                <SkinMenu />
                <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="退出">
                  <LogOut />
                </Button>
              </div>
            </div>
          </header>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BootstrapContext.Provider>
  );
}
