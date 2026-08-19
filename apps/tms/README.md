# 任务管理系统（TMS）

Studio Admin 官方模板为壳，本仓库业务（Better Auth + 本地 MySQL + Route Handlers）接在上面。

底模：[arhamkhnz/next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)（Next.js 16 + TypeScript + Tailwind v4 + shadcn）。对照官方演示：[next-shadcn-admin-dashboard.vercel.app](https://next-shadcn-admin-dashboard.vercel.app)。

不要再启动 FastAPI / `:8000`。Next 一个进程；MySQL 用本目录的 Docker Compose。

## 启动

### 1. 本地 MySQL

在 `apps/tms` 里起官方演示库（库名 / 账号见 [`.env.example`](.env.example)，与 `docker-compose.yml` 一致）：

```bash
cd apps/tms
cp .env.example .env
npm install
docker compose up -d
# 或：npm run mysql:up
```

Compose 会拉起本机 `localhost:3306` 的 MySQL，并跑 `npm run db:setup`（Better Auth 建表 + 业务表 + 演示种子）。

### 2. TMS 怎么连上

`src/lib/db.ts` 读环境变量 `DATABASE_URL`。未设置时默认就是这份本地 Compose MySQL。复制 `.env.example` 即可，不必再配远程库。

### 3. 跑应用

```bash
npm run dev
```

打开 <http://localhost:3000>（官方 Login v1）。未登录访问 `/dashboard/*` 会回到登录页。

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | 本地 MySQL 连接串，默认见 `.env.example` |
| `BETTER_AUTH_SECRET` | 未设则用内置演示密钥 |
| `BETTER_AUTH_URL` | 默认 `http://localhost:3000` |

## 演示账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | `admin@tms.local` | `admin123` |
| 值班 | `duty@tms.local` | `duty123` |
| 只读 | `readonly@tms.local` | `read123` |

登录后业务页：`/dashboard/tasks`、`/dashboard/users`、`/dashboard/roles`。侧栏 / 顶栏 / 主题仍是模板自带导航（与官方 demo 同一套）。

## 保留的模板 chrome 文件（未重画）

这些文件来自官方模板，只做登录提交 / 登出 / 会话守卫等接线，不改颜色、字体、间距、导航结构：

| 用途 | 路径 |
| --- | --- |
| 根布局 + 主题启动 | `src/app/layout.tsx` |
| CSS 变量 / Tailwind | `src/app/globals.css` |
| 主题预设 | `src/styles/presets/*.css` |
| Theme boot | `src/scripts/theme-boot.tsx` |
| Preferences / theme store | `src/stores/preferences/*`、`src/lib/preferences/*` |
| Dashboard 布局（侧栏 + 顶栏） | `src/app/(main)/dashboard/layout.tsx` |
| App sidebar | `src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx` |
| Nav main / user / support | `src/app/(main)/dashboard/_components/sidebar/nav-main.tsx`、`nav-user.tsx`、`support-card.tsx` |
| Sidebar 数据 | `src/navigation/sidebar/sidebar-items.ts` |
| 顶栏：搜索 / 布局 / 主题 / GitHub / 账号 | `src/app/(main)/dashboard/_components/header/*` |
| shadcn sidebar 原语 | `src/components/ui/sidebar.tsx` |
| Login v1 壳 | `src/app/(main)/auth/v1/login/page.tsx` |
| Login 表单 | `src/app/(main)/auth/_components/login-form.tsx` |
| 应用名 / meta | `src/config/app-config.ts` |
| Tasks 表格 UI | `src/app/(main)/dashboard/tasks/_components/tasks.tsx`、`columns.tsx`、`tasks-toolbar.tsx` |
| Users / Roles 表格 UI | `src/app/(main)/dashboard/users/_components/*`、`roles/_components/*` |

## 接到模板上的业务

- Better Auth：`src/lib/auth.ts`、`src/app/api/auth/[...all]/route.ts`
- 本地 MySQL + 种子（管理员 / 值班 / 只读）：`src/lib/db.ts`、`src/lib/init.ts`、`docker-compose.yml`
- Route Handlers：`src/app/api/tasks`、`users`、`roles`、`meta`、`bootstrap`
- 任务 / 用户 / 角色页只换数据源，表格仍用模板组件

纸票版 / 控制台版只在仓库 `variants/` 存档，不参与 TMS 默认界面。
