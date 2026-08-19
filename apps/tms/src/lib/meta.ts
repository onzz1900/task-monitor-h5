/** 静态字典：任务类型 / 状态 / secretRef（只存引用名，密钥本体在服务端密管，永不下发）。 */

export const TASK_TYPES: Record<string, string> = {
  review: "评价采集",
  chat: "聊天采集",
  draw: "绘图采集",
  conv: "转化率监控",
  monitor: "数据监控",
  report: "报表任务",
};

export const STATUSES = ["运行中", "待流转", "已阻塞", "本轮已完成"] as const;

export const SECRET_REFS = [
  { ref: "ops-callback-key", description: "回调网关签名密钥" },
  { ref: "tmall-open-api", description: "天猫开放平台凭证" },
  { ref: "jd-open-api", description: "京东开放平台凭证" },
] as const;
