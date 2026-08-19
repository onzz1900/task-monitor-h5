# 任务流转中心 / Mission Transfer Center — 备选视觉方案（纸面票据风）

这是「任务流转中心」的第二条并行设计线：同一套产品与信息架构，另一种视觉语言。
官方原型（`variants/ops-console/`）是深色高密度控制台；本方案走**浅色纸面 + 票据卡片 + 衬线标题**的编辑风格，深色主题为暖炭色变体。

## 预览

在本目录启动一个静态服务器即可：

```bash
cd variants/transfer-center-fable
python3 -m http.server 8080
```

然后打开 <http://localhost:8080>。纯 HTML/CSS/JS，无登录、无后端、无构建步骤。

## 内容与信息架构

- 顶部统计：**运行中 / 待流转 / 已阻塞 / 本轮已完成**
- 任务清单（票据式卡片，按下次流转时间排序）：
  - 点位进度环（如 12/20）
  - 票根区突出显示**下次流转时间**（含相对时间与交接对象）
  - 上次运行结果（成功 / 失败 + 具体数字，如「成功 · 采集 1,368 条会话」）
- 点击任意任务打开**详情面板**：最近一次运行时间、运行结果、点位进度摘要、负责人
- 顶栏**浅色 / 深色主题切换**，偏好写入 `localStorage`（键 `tcf-theme`）
- 中文界面，PC 与移动端 Web 自适应（窄屏下票根移到卡片底部、详情改为底部抽屉）

## 示例数据

电商运营场景的模拟任务（见 `data.js`）：评价采集、聊天记录采集、绘图记录采集、转化率监控、数据监控、报表任务。页面以 `data.js` 中固定的时间基准计算相对时间，保证演示效果稳定。

## 任务登记中心（register.html）

顶栏「任务登记」进入 `register.html`：登记 / 编辑 / 查看任务配置，纸票视觉不变。无后端 —— 数据 = `registry-data.js` 种子 + 浏览器 `localStorage` 覆盖（键 `tcf-registry-v1`），「重置演示数据」可恢复种子。

调度为工程化实现：内置 5 字段 cron 解析器（支持 `*`、`a,b`、`a-b`、`*/n`、`a-b/n`，日/周取「或」），统一按 **Asia/Shanghai** 推导下次流转，表单内实时预览下一次触发时刻；固定间隔以 `updatedAt` 为锚点对齐。

### 登记数据模型（registry shape）

与看板任务同源的形状，后续 ops-console 等其他皮肤可直接共享：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定任务编号，`REG-1001` 起自增 |
| `name` / `description` | string | 名称（必填）/ 描述 |
| `owner` | string | 负责人 |
| `type` | `collect` \| `monitor` \| `report` | 采集 / 监控 / 报表 |
| `points` | `{ total, note }` | 点位数量（必填，≥1）+ 说明 |
| `schedule` | `{ kind, cron, intervalMinutes, timezone }` | `kind` ∈ `cron`/`interval`；`timezone` 固定 `Asia/Shanghai`；**下次流转由此推导** |
| `callback` | `null` 或 `{ url, timeoutMs, retries, secretRef }` | 可选 POST 回调：地址、超时（默认 10000ms）、失败重试（默认 3 次）、**secretRef 只存引用名，密钥本体不进前端** |
| `backup` | `{ keepRuns }` | 保留最近 N 次运行结果，默认 10 |
| `createdAt` / `updatedAt` | ISO string | 创建 / 更新时间 |

可选的 secretRef 引用名：`ops-callback-key` / `tmall-open-api` / `jd-open-api`（见 `registry-data.js`）。

## 文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 看板页面骨架与主题预加载 |
| `styles.css` | 浅色纸面 / 暖炭深色两套主题（含登记页样式） |
| `app.js` | 看板：统计、筛选、列表渲染、详情面板、主题切换 |
| `data.js` | 看板模拟任务数据与时间基准 |
| `register.html` | 任务登记中心页面 |
| `registry.js` | 登记逻辑：cron 解析、下次流转推导、表单、localStorage 存取 |
| `registry-data.js` | 登记种子数据、类型 / secretRef 字典与默认值 |
