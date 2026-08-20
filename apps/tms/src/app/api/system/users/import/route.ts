import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { ApiError, handleApiError, requirePermission } from "@/lib/rbac";
import { findSysUserByEmail, findSysUserByUserName, insertSysUser } from "@/lib/ruoyi";

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission("system:user:import");
    let text = "";
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      text = file instanceof File ? await file.text() : String(form.get("csv") ?? "");
    } else {
      text = await req.text();
    }
    const rows = parseCsv(text);
    if (rows.length === 0) throw new ApiError(400, "CSV 为空");
    const header = rows[0].map((h) => h.toLowerCase());
    const hasHeader = header.includes("user_name") || header.includes("email");
    const body = hasHeader ? rows.slice(1) : rows;
    const idx = (name: string, fallback: number) => {
      const i = header.indexOf(name);
      return i >= 0 ? i : fallback;
    };
    let imported = 0;
    for (const row of body) {
      const user_name = row[idx("user_name", 0)] ?? "";
      const nick_name = row[idx("nick_name", 1)] ?? user_name;
      const email = row[idx("email", 2)] ?? "";
      const password = row[idx("password", 3)] ?? "";
      const phonenumber = row[idx("phonenumber", 4)] ?? "";
      if (!user_name || !email) continue;
      if (await findSysUserByUserName(user_name) || await findSysUserByEmail(email)) continue;
      if (password.length < 6) throw new ApiError(400, `密码至少 6 位：${user_name}`);
      const exists = await queryOne<{ id: string }>("SELECT id FROM `user` WHERE email = ?", [email]);
      if (!exists) {
        await auth.api.signUpEmail({ body: { email, password, name: nick_name } });
      }
      await insertSysUser({ user_name, nick_name, email, phonenumber }, actor.name);
      imported += 1;
    }
    return NextResponse.json({ ok: true, imported }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
