"use client";

/** Better Auth client + JSON API helper. */
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
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
      else if (typeof data?.message === "string") detail = data.message;
    } catch {
      /* non-JSON error body */
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
