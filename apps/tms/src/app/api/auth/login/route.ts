/** BFF：把登录转发给 FastAPI（fastapi-users），JWT 存入 httpOnly Cookie。 */
import { NextRequest, NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/bff";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ detail: "请填写邮箱与密码" }, { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/jwt/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "无法连接主 API，请确认 FastAPI 已启动（端口 8000）" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ detail: "邮箱或密码错误" }, { status: 401 });
  }
  const { access_token } = (await upstream.json()) as { access_token: string };
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_COOKIE, access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}
