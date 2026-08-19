"use client";

/** 客户端工具：API 请求（经 BFF 代理到 FastAPI）、时间格式化（统一北京时间）、皮肤。 */

export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let detail = `请求失败（${res.status}）`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
      else if (typeof data?.message === "string") detail = data.message;
    } catch {}
    throw new RequestError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export function login(email: string, password: string): Promise<{ ok: boolean }> {
  return api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return api("/api/auth/logout", { method: "POST" });
}

const dateFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function fmtBJ(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso)).replace(" ", " ");
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  const abs = Math.abs(mins);
  const dir = mins >= 0 ? "后" : "前";
  if (abs < 1) return "现在";
  if (abs < 60) return `${abs} 分钟${dir}`;
  if (abs < 24 * 60) return `${Math.floor(abs / 60)} 小时 ${abs % 60} 分${dir}`;
  return `${Math.floor(abs / (24 * 60))} 天${dir}`;
}

export type Skin = "fable" | "console";

export function getSkin(): Skin {
  if (typeof document === "undefined") return "fable";
  return document.documentElement.getAttribute("data-skin") === "console" ? "console" : "fable";
}

export function setSkin(skin: Skin): void {
  document.documentElement.setAttribute("data-skin", skin);
  try {
    localStorage.setItem("tms-skin", skin);
  } catch {}
}
