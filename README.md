# task-monitor-h5

任务监控 H5 原型 — 打开就能看清每个任务在干什么

默认预览是 **任务流转中心**（Mission Transfer Center）。在仓库根目录执行：

```bash
python3 -m http.server 4173
```

打开 http://localhost:4173/ （即 `/`）。

实现位于 [`variants/ops-console/`](variants/ops-console/)。根目录 `index.html` 只做预览入口，资源仍从该目录加载。
