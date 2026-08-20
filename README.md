# task-monitor-h5

任务监控 H5 原型 — 打开就能看清每个任务在干什么

默认预览是 **任务流转中心**（Mission Transfer Center）。在仓库根目录执行：

```bash
python3 -m http.server 4173
```

打开 http://localhost:4173/ （即 `/`）。

「任务流转中心」有两个并行的正式版本，顶栏均有「纸票版 / 控制台版」版本切换，可互相跳转：

- **纸票版**（默认根目录预览）：[`variants/transfer-center-fable/`](variants/transfer-center-fable/)，浅色纸面票据风。也可直接访问 `/variants/transfer-center-fable/`。
- **控制台版**：[`variants/ops-console/`](variants/ops-console/)，深色高密度控制台风。直接访问 `/variants/ops-console/`。

根目录 `index.html` 只做预览入口，资源从 `variants/transfer-center-fable/` 加载。两个版本目录也都可以单独启动预览（在各自目录内执行 `python3 -m http.server`；单独启动时版本切换链接需从仓库根启动才可用）。

## 任务管理系统（TMS）

静态原型之外，[`apps/tms/`](apps/tms/) 是任务管理系统。界面底是官方 [Studio Admin](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)（侧栏、顶栏、主题、Login v1、Tasks 表格均保留模板文件），业务是 Next.js Route Handlers + 本地 MySQL + Better Auth。纸票版 / 控制台版只作为 `variants/` 存档。

```bash
cd apps/tms
cp .env.example .env          # 本地 DATABASE_URL，见该文件
npm install
docker compose up -d          # 本机 MySQL + 建表/种子
npm run dev                   # http://localhost:3000
```

TMS 通过 `DATABASE_URL` 连这份本地库（未设置时也默认连 Compose 的 MySQL）。mysql2 预处理不能绑定 `LIMIT ?`（MySQL 8.x 会 `mysqld_stmt_execute` 报错），条数在应用里夹成整数后写入 SQL。保留了哪些模板 chrome 文件见 [apps/tms/README.md](apps/tms/README.md)。

用户 / 角色 / 菜单按官方若依字段落在 MySQL：`sys_user`、`sys_role`、`sys_menu`、`sys_dept`、`sys_user_role`、`sys_role_menu`，对照 [RuoYi-Vue](https://github.com/yangzongzhuan/RuoYi-Vue) `sql/ry_20260417.sql`。登录仍是 Better Auth。非超管侧栏按 `sys_menu` 树 + `sys_role_menu` 动态显示（按钮级 F 缺则不画）；超管仍是完整模板导航。未登录 `/dashboard/*` 回 Login v1；停用账号下一请求失效。`/dashboard/kanban` 是官方看板壳，列对照 TMS 状态（待流转 planned / 运行中 building / 已阻塞 qa / 本轮已完成 shipped）；拖到 Ideas 也写回 `待流转`，不写英文列名。
