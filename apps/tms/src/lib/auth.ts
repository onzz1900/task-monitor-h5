/**
 * Better Auth 配置：邮箱 + 密码登录，会话存 SQLite。
 * 密码哈希、会话签发均由库完成。用户表附加 role 字段（角色 code）。
 */
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: db(),
  secret: process.env.BETTER_AUTH_SECRET ?? "tms-demo-secret-change-me-0123456789abcdef",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "readonly",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
