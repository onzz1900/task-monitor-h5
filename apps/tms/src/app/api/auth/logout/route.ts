/** BFF：退出登录 = 清除会话 Cookie。 */
import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/bff";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
