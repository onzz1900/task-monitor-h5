import { NextResponse } from "next/server";

import { loadBootstrap } from "@/lib/bootstrap";

export async function GET() {
  const boot = await loadBootstrap();
  if (!boot) return NextResponse.json({ detail: "未登录" }, { status: 401 });
  if (boot.disabled) return NextResponse.json({ detail: "账号已停用" }, { status: 403 });
  return NextResponse.json(boot);
}
