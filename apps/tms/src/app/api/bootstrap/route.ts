import { NextResponse } from "next/server";
import { loadBootstrap } from "@/lib/bootstrap";

export async function GET() {
  const boot = await loadBootstrap();
  if (!boot) return NextResponse.json({ detail: "未登录" }, { status: 401 });
  return NextResponse.json(boot);
}
