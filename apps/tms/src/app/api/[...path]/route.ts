/**
 * BFF 透传代理：/api/* → FastAPI（系统记录源）。
 * 只做两件事：附加 Bearer（来自 httpOnly Cookie）、原样转发请求与响应。
 * 不做任何业务逻辑，不落任何数据。
 */
import { NextRequest, NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/bff";

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const url = new URL(`${API_URL}/api/${path.join("/")}`);
  url.search = new URL(req.url).search;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "无法连接主 API，请确认 FastAPI 已启动（端口 8000）" },
      { status: 502 }
    );
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
