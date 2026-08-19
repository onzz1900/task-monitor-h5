"use client";

/** 客户端工具：Better Auth、API 请求、时间格式化（统一北京时间）、皮肤。 */
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
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
    } catch {
      /* 非 JSON 错误体 */
    }
    throw new RequestError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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

const skinListeners = new Set<() => void>();

export function getSkin(): Skin {
  if (typeof document === "undefined") return "fable";
  return document.documentElement.getAttribute("data-skin") === "console" ? "console" : "fable";
}

export function subscribeSkin(onStoreChange: () => void): () => void {
  skinListeners.add(onStoreChange);
  return () => {
    skinListeners.delete(onStoreChange);
  };
}

export function setSkin(skin: Skin): void {
  document.documentElement.setAttribute("data-skin", skin);
  try {
    localStorage.setItem("tms-skin", skin);
  } catch {
    /* ignore */
  }
  skinListeners.forEach((listener) => listener());
}
