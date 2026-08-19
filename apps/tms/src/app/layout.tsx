import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "任务流转中心 · 任务管理系统",
  description: "任务流转中心 / Mission Transfer Center：电商采集、监控与报表任务的管理系统。",
};

const skinScript = `
(function () {
  try {
    var skin = localStorage.getItem("tms-skin");
    if (skin === "fable" || skin === "console") {
      document.documentElement.setAttribute("data-skin", skin);
    }
  } catch (err) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" data-skin="fable" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700;900&family=Spline+Sans+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
