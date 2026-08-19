import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "任务管理系统",
  description: "电商采集、监控与报表任务的管理系统。",
};

const skinScript = `
(function () {
  try {
    var skin = localStorage.getItem("tms-skin");
    if (skin === "fable" || skin === "console" || skin === "studio") {
      document.documentElement.setAttribute("data-skin", skin);
    }
  } catch (err) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-skin="studio" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
