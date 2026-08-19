import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { loadBootstrap } from "@/lib/bootstrap";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const boot = await loadBootstrap();
  if (!boot) redirect("/login");
  return <AppShell initial={boot}>{children}</AppShell>;
}
