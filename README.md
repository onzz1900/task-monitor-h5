# task-monitor-h5

任务监控 H5 原型 — 打开就能看清每个任务在干什么

默认预览是 **任务流转中心**（Mission Transfer Center）。在仓库根目录执行：

```bash
python3 -m http.server 4173
```

打开 http://localhost:4173/ （即 `/`）。

默认预览为**纸面票据风**设计，实现位于 [`variants/transfer-center-fable/`](variants/transfer-center-fable/)。根目录 `index.html` 只做预览入口，资源仍从该目录加载；该目录也可单独启动预览（见其中 README）。

早期的深色控制台版本保留在 [`variants/ops-console/`](variants/ops-console/)（存档，不再作为默认入口）。
