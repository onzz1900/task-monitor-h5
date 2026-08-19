/* 任务登记中心 — 种子数据与字典。
   注册数据的形状（registry shape）刻意保持与看板任务同源，
   后续 ops-console 或其他皮肤可直接共享：

   {
     id: "REG-1001",              // 稳定任务编号
     name: "…", description: "…",
     owner: "…",
     type: "collect" | "monitor" | "report",   // 采集 / 监控 / 报表
     points: { total: 12, note: "…" },          // 点位数量 + 说明
     schedule: {                                 // 调度（必填）
       kind: "cron" | "interval",
       cron: "30 9 * * *",                       // kind=cron 时生效（分 时 日 月 周）
       intervalMinutes: 60,                      // kind=interval 时生效
       timezone: "Asia/Shanghai"                 // 固定；下次流转由此推导
     },
     callback: null | {                          // 回调（可选）
       url: "https://…",                         // POST 地址
       timeoutMs: 10000,                         // 默认 10 秒
       retries: 3,                               // 失败重试次数，默认 3
       secretRef: "ops-callback-key"             // 只存引用名，密钥本体不进前端
     },
     backup: { keepRuns: 10 },                   // 保留最近 N 次运行结果，默认 10
     createdAt: "ISO", updatedAt: "ISO"
   }
*/
window.TCF_REGISTRY_META = {
  types: { collect: "采集", monitor: "监控", report: "报表" },
  secretRefs: [
    { ref: "ops-callback-key", description: "回调网关签名密钥" },
    { ref: "tmall-open-api", description: "天猫开放平台凭证" },
    { ref: "jd-open-api", description: "京东开放平台凭证" },
  ],
  defaults: { timeoutMs: 10000, retries: 3, keepRuns: 10 },
};

window.TCF_REGISTRY_SEED = [
  {
    id: "REG-1001",
    name: "旗舰店评价采集",
    description: "回写近 24 小时新增评价，供看板与日报使用。",
    owner: "林晓禾",
    type: "collect",
    points: { total: 14, note: "14 个旗舰店点位" },
    schedule: { kind: "cron", cron: "30 8-20/3 * * *", intervalMinutes: null, timezone: "Asia/Shanghai" },
    callback: {
      url: "https://hooks.example.com/tms/review",
      timeoutMs: 10000,
      retries: 3,
      secretRef: "tmall-open-api",
    },
    backup: { keepRuns: 10 },
    createdAt: "2026-08-12T02:00:00.000Z",
    updatedAt: "2026-08-17T06:30:00.000Z",
  },
  {
    id: "REG-1002",
    name: "实时成交数据监控",
    description: "成交看板数据核对，异常即刻告警。",
    owner: "赵启明",
    type: "monitor",
    points: { total: 16, note: "16 个成交监控点位（天猫 + 京东）" },
    schedule: { kind: "interval", cron: null, intervalMinutes: 30, timezone: "Asia/Shanghai" },
    callback: {
      url: "https://hooks.example.com/tms/monitor",
      timeoutMs: 8000,
      retries: 5,
      secretRef: "jd-open-api",
    },
    backup: { keepRuns: 20 },
    createdAt: "2026-08-10T01:20:00.000Z",
    updatedAt: "2026-08-18T09:05:00.000Z",
  },
  {
    id: "REG-1003",
    name: "日报报表任务",
    description: "华东 / 华南 / 全国三张日报，16 点出全国表。",
    owner: "苏晚",
    type: "report",
    points: { total: 3, note: "华东 / 华南 / 全国" },
    schedule: { kind: "cron", cron: "0 16 * * 1-6", intervalMinutes: null, timezone: "Asia/Shanghai" },
    callback: null,
    backup: { keepRuns: 10 },
    createdAt: "2026-08-08T03:00:00.000Z",
    updatedAt: "2026-08-15T08:10:00.000Z",
  },
];
