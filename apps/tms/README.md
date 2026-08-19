# 任务流转中心 · 任务管理系统（TMS）

「任务流转中心 / Mission Transfer Center」的任务管理系统首个版本：登录、菜单与权限、用户与角色、任务的登记 / 修改 / 运行，调度（cron / 固定间隔，Asia/Shanghai）与回调（secretRef）为一级表单区块，每个任务备份最近 N 次运行结果（默认 10）。

- 前端：Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Next.js Route Handlers（本应用即系统记录源），数据存 SQLite 文件（`data/tms.db`，首次启动自动建表 + 写入演示数据）
- 认证：[Better Auth](https://www.better-auth.com/)（邮箱 + 密码，密码哈希与会话由库处理），RBAC 用角色 / 权限表实现
- 视觉：默认**纸票版**皮肤（纸面 / 票据 / 衬线标题），顶栏可切换**控制台版**深色皮肤；`variants/` 下的静态原型保持原样作为存档

## 启动

```bash
cd apps/tms
npm install
npm run dev
```

打开 <http://localhost:3000> 即到登录页。

## 演示账号

| 角色 | 邮箱 | 密码 | 能做什么 |
| --- | --- | --- | --- |
| 管理员 | `admin@tms.local` | `admin123` | 全部：任务增改运行、用户、角色 |
| 值班 | `duty@tms.local` | `duty123` | 任务的查看、登记、修改、运行 |
| 只读 | `readonly@tms.local` | `read123` | 仅查看任务（不能登记 / 修改 / 运行） |

菜单按权限过滤：只读账号看不到「用户管理」「角色权限」，任务页也没有登记 / 运行按钮；接口侧同样校验（403）。

## 数据模型

SQLite 表结构只用 `INTEGER` / `TEXT` 等可移植类型，可平移到 Postgres。Better Auth 自建 `user` / `session` / `account` / `verification` 表；业务表如下：

| 表 | 字段（主干） | 说明 |
| --- | --- | --- |
| `roles` | `id, code, name, description` | 角色：`admin` 管理员 / `duty` 值班 / `readonly` 只读 |
| `permissions` | `id, code, name` | 权限点：`task:read / task:create / task:update / task:run / user:read / user:manage / role:read` |
| `role_permissions` | `role_id, permission_id` | 角色 ↔ 权限多对多 |
| `menus` | `id, title, path, sort, permission_code` | 菜单项；无对应权限的角色不可见 |
| `user`（Better Auth） | `… + role` | 附加 `role` 字段存角色 code |
| `tasks` | `id, code, title, description, type, status, owner_name, channel` | 任务主体；`type` ∈ 评价/聊天/绘图/转化率/监控/报表 |
| | `points_done, points_total, points_note` | 点位进度（如 12/20） |
| | `schedule_kind, cron_expr, interval_minutes, timezone, next_run_at` | 调度：cron 或固定间隔，固定 `Asia/Shanghai`；`next_run_at` 即「下次流转」，由 cron/间隔推导 |
| | `callback_url, callback_timeout_ms, callback_retries, callback_secret_ref` | 可选 POST 回调；只存 **secretRef** 引用名，密钥本体在服务端密管，永不下发 |
| | `keep_runs` | 运行结果备份份数（默认 10） |
| `task_runs` | `id, task_id, ran_at, ok, result_text, duration_ms` | 运行记录；每次运行后裁剪到最近 `keep_runs` 条 |

「运行一次」当前为模拟执行：随机成功 / 失败并生成带具体数字的结果文案，推进点位、写入运行记录、按调度推导下一次流转时间。

## 接口一览

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| POST | `/api/auth/sign-in/email` 等 | Better Auth 托管 |
| GET | `/api/bootstrap` | 登录即可（返回用户 + 权限 + 可见菜单） |
| GET | `/api/meta` | `task:read` |
| GET / POST | `/api/tasks` | `task:read` / `task:create` |
| GET / PUT | `/api/tasks/:id` | `task:read` / `task:update` |
| POST | `/api/tasks/:id/run` | `task:run` |
| GET | `/api/users`，PATCH `/api/users/:id` | `user:read` / `user:manage` |
| GET | `/api/roles` | `role:read` |
