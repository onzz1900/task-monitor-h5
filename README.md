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

静态原型之外，[`apps/tms/`](apps/tms/) 是任务管理系统。界面底是官方 [Studio Admin](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)（侧栏、顶栏、主题、Login v1、Tasks 表格均保留模板文件），业务是 Next.js Route Handlers + SQLite + Better Auth。纸票版 / 控制台版只作为 `variants/` 存档。只需一个进程：

```bash
cd apps/tms
npm install
npm run dev   # http://localhost:3000
```

保留了哪些模板 chrome 文件（sidebar、app-sidebar、theme、dashboard layout 等）见 [apps/tms/README.md](apps/tms/README.md)。
