const NOW = new Date("2026-08-18T11:42:00");

const WEEKDAYS_LONG = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAYS_SHORT = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const TASKS = [
  {
    id: "辰-1842",
    title: "三季度董事会材料复核",
    dept: "财务",
    status: "progress",
    owner: "郝明泽",
    action: "正在整理 15:00 工作会用的附件包",
    nextTransfer: "2026-08-18T15:00:00",
    nextOwner: "周若兰",
    notes:
      "董事会要求把资金桥和两项延期交割事项写在首页。财务保管材料，15:00 流转给董事会秘书处。",
    chain: [
      "郝明泽于 08:40 从总账收回差异说明",
      "周若兰 15:00 接收锁定版 PDF，负责分发",
    ],
  },
  {
    id: "辰-1847",
    title: "安科美续约交接",
    dept: "销售",
    status: "pending",
    owner: "沈佩宜",
    action: "等待商务条款从交易支持组返回",
    nextTransfer: "2026-08-18T13:15:00",
    nextOwner: "白欧文",
    notes:
      "续约金额 140 万美元、期限 24 个月。折扣说明尚未到位，客户交付不能启动对接会。",
    chain: [
      "沈佩宜昨日 17:10 打开续约工作间",
      "白欧文 13:15 接收已签订单",
    ],
  },
  {
    id: "辰-1851",
    title: "供应商工作说明书法务流转",
    dept: "法务",
    status: "blocked",
    owner: "林亦宁",
    action: "阻塞——对方尚未退回红线稿",
    nextTransfer: "2026-08-18T14:30:00",
    nextOwner: "江泊",
    notes:
      "曜辉科技仍扣着责任上限条款。在会签落地前，法务不能把工作说明书交给产品。",
    chain: [
      "林亦宁于 09:05 发出第三次催办",
      "法务解除阻塞后，江泊排队接收实施",
    ],
  },
  {
    id: "辰-1833",
    title: "安全例外跟进",
    dept: "产品",
    status: "overdue",
    owner: "江泊",
    action: "风险委员会要求书面例外路径",
    nextTransfer: "2026-08-17T16:00:00",
    nextOwner: "林亦宁",
    notes:
      "供应商临时权限本应于昨日 16:00 流转给法务。书面说明仍未写完。",
    chain: [
      "江泊错过周一 16:00 的流转节点",
      "备忘录未到，林亦宁无法备案例外",
    ],
  },
  {
    id: "辰-1855",
    title: "客户启动会复盘",
    dept: "客户交付",
    status: "progress",
    owner: "欧夏晚",
    action: "正在整理今早通话的行动清单",
    nextTransfer: "2026-08-18T16:45:00",
    nextOwner: "沈佩宜",
    notes:
      "北辰主持了港湾货运启动会。四项跟进需先明确负责人，再把账户交回销售做高管赞助人映射。",
    chain: [
      "欧夏晚主持 09:30 启动会",
      "沈佩宜 16:45 接收赞助人映射",
    ],
  },
  {
    id: "辰-1828",
    title: "发票争议升级",
    dept: "财务",
    status: "overdue",
    owner: "郝明泽",
    action: "催收组在等贷记凭证结论",
    nextTransfer: "2026-08-17T11:30:00",
    nextOwner: "周若兰",
    notes:
      "西桥实业质疑两张七月发票。贷记凭证本应于昨日上午流转至财务负责人办公室。",
    chain: [
      "应收账款周五标出争议",
      "周若兰原定周一 11:30 收到处理建议",
    ],
  },
  {
    id: "辰-1859",
    title: "周运营例会跟进",
    dept: "产品",
    status: "progress",
    owner: "江泊",
    action: "为三项未结平台事项指定负责人",
    nextTransfer: "2026-08-18T15:20:00",
    nextOwner: "欧夏晚",
    notes:
      "运营同步会 10:15 结束。客户交付侧仍有三项没有接收人。",
    chain: [
      "江泊在会上当场记录纪要",
      "欧夏晚 15:20 接收交付事项",
    ],
  },
  {
    id: "辰-1861",
    title: "合作框架协议流转",
    dept: "法务",
    status: "pending",
    owner: "林亦宁",
    action: "排在曜辉工作说明书之后",
    nextTransfer: "2026-08-19T09:00:00",
    nextOwner: "沈佩宜",
    notes:
      "明途合伙框架协议已备好。法务从阻塞的工作说明书脱身后再转商务审阅。",
    chain: [
      "模板上周四已获批",
      "沈佩宜周三 09:00 审商务条款",
    ],
  },
  {
    id: "辰-1840",
    title: "办公租赁补充协议",
    dept: "法务",
    status: "blocked",
    owner: "周若兰",
    action: "业主律师尚未退回意见",
    nextTransfer: "2026-08-18T17:00:00",
    nextOwner: "郝明泽",
    notes:
      "南京西路扩租附件冻结中。法务未放行补充协议前，财务不能计提占用成本。",
    chain: [
      "周若兰于 08:20 发出催办",
      "若阻塞解除，郝明泽 17:00 接收数字",
    ],
  },
  {
    id: "辰-1864",
    title: "四季度招聘计划评审",
    dept: "人力",
    status: "pending",
    owner: "金诺",
    action: "等待周四编制委员会",
    nextTransfer: "2026-08-20T11:30:00",
    nextOwner: "周若兰",
    notes:
      "编制方案已起草。周四锁定流转给财务，便于委员会看到全成本。",
    chain: [
      "金诺昨日完成经理侧征集",
      "周若兰周四 11:30 接收全成本模型",
    ],
  },
  {
    id: "辰-1836",
    title: "新人入职节点检查",
    dept: "人力",
    status: "done",
    owner: "金诺",
    action: "已流转至用人经理",
    nextTransfer: "2026-08-17T14:00:00",
    nextOwner: "各部门负责人",
    notes:
      "八月批次节点检查已完成。电脑、工牌与带教安排均按时交接。",
    chain: [
      "人力于周一 14:00 完成流转",
      "经理现负责第一周日程",
    ],
  },
  {
    id: "辰-1821",
    title: "产品路线图对齐",
    dept: "产品",
    status: "done",
    owner: "江泊",
    action: "纪要已发给销售与交付",
    nextTransfer: "2026-08-16T17:30:00",
    nextOwner: "沈佩宜",
    notes:
      "四季度主题已锁定。销售于周日晚间收到对外口径。",
    chain: [
      "工作会周六结束",
      "沈佩宜周日 17:30 确认口径",
    ],
  },
  {
    id: "辰-1866",
    title: "预算偏差站会",
    dept: "财务",
    status: "pending",
    owner: "周若兰",
    action: "议程已排入明日 10:00 会议室",
    nextTransfer: "2026-08-19T10:00:00",
    nextOwner: "郝明泽",
    notes:
      "两个成本中心仍超计划。站会结束后，工作底稿流转给总账。",
    chain: [
      "周若兰于 07:50 发布预读材料",
      "郝明泽周三 10:00 接收行动项",
    ],
  },
  {
    id: "辰-1868",
    title: "客户健康度复盘",
    dept: "客户交付",
    status: "progress",
    owner: "欧夏晚",
    action: "正在准备风险账户简报",
    nextTransfer: "2026-08-18T17:30:00",
    nextOwner: "沈佩宜",
    notes:
      "三个账户跌破健康阈值。销售需在今日收工前拿到简报。",
    chain: [
      "交付今早完成账户评分",
      "沈佩宜 17:30 接收简报",
    ],
  },
];

const WEEK_MEETINGS = [
  { day: "一", count: 3 },
  { day: "二", count: 6 },
  { day: "三", count: 4 },
  { day: "四", count: 2 },
  { day: "五", count: 2 },
  { day: "六", count: 1 },
  { day: "日", count: 0 },
];

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "live", label: "流转中" },
  { id: "risk", label: "风险" },
  { id: "blocked", label: "阻塞" },
  { id: "overdue", label: "逾期" },
  { id: "done", label: "已完成" },
];

const STATUS_LABEL = {
  progress: "进行中",
  pending: "待处理",
  blocked: "阻塞",
  overdue: "逾期",
  done: "已完成",
};

const state = {
  filter: "all",
  selected: null,
};

const $ = (id) => document.getElementById(id);

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS_LONG[date.getDay()]}`;
}

function formatTransfer(iso) {
  const date = new Date(iso);
  const sameDay = date.toDateString() === NOW.toDateString();
  const yesterday = new Date(NOW);
  yesterday.setDate(NOW.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (sameDay) return `${time} · 今天`;
  if (isYesterday) return `${time} · 昨天`;
  return `${time} · ${WEEKDAYS_SHORT[date.getDay()]} ${date.getMonth() + 1}月${date.getDate()}日`;
}

function initials(name) {
  return name.slice(0, 2);
}

function matchesFilter(task) {
  if (state.filter === "all") return true;
  if (state.filter === "live") return task.status === "progress" || task.status === "pending";
  if (state.filter === "risk") return task.status === "blocked" || task.status === "overdue";
  return task.status === state.filter;
}

function stats() {
  const open = TASKS.filter((task) => task.status !== "done");
  const todayMeetings = 6;
  const weekMeetings = WEEK_MEETINGS.reduce((sum, day) => sum + day.count, 0);
  return {
    todayMeetings,
    todayFollowUps: 4,
    weekMeetings,
    pending: TASKS.filter((task) => task.status === "pending").length,
    progress: TASKS.filter((task) => task.status === "progress").length,
    done: TASKS.filter((task) => task.status === "done").length,
    overdue: TASKS.filter((task) => task.status === "overdue"),
    blocked: TASKS.filter((task) => task.status === "blocked"),
    open: open.length,
  };
}

function renderClock() {
  const elapsed = Date.now() - renderClock.started;
  const clock = new Date(NOW.getTime() + elapsed);
  $("live-clock").textContent = formatClock(clock);
  $("live-date").textContent = `${formatDate(NOW)} · 现场实时`;
}
renderClock.started = Date.now();

function renderMosaic() {
  const s = stats();
  const maxWeek = Math.max(...WEEK_MEETINGS.map((d) => d.count), 1);
  const doneShare = Math.round((s.done / TASKS.length) * 100);
  const pendingShare = Math.round(((s.pending + s.progress) / TASKS.length) * 100);
  const ring = 2 * Math.PI * 28;
  const dayProgress = 0.48;

  const weekBars = WEEK_MEETINGS.map(
    (day, index) => `
      <i class="${index === 1 ? "today" : ""}" style="height:${Math.max(8, (day.count / maxWeek) * 100)}%"></i>
    `
  ).join("");

  const weekLabels = WEEK_MEETINGS.map((day) => `<span>${day.day}</span>`).join("");
  const riskItems = [...s.blocked, ...s.overdue]
    .slice(0, 3)
    .map(
      (task) => `
        <li>
          <span>${task.title}</span>
          <b>${STATUS_LABEL[task.status]}</b>
        </li>
      `
    )
    .join("");

  $("strip").innerHTML = `
    <button type="button" data-filter="all"><b>${s.todayMeetings}</b><span>今日</span></button>
    <button type="button"><b>${s.weekMeetings}</b><span>本周</span></button>
    <button type="button" data-filter="live"><b>${s.pending + s.progress}</b><span>在办</span></button>
    <button type="button" data-filter="done"><b>${s.done}</b><span>完成</span></button>
    <button type="button" class="risk" data-filter="risk"><b>${s.overdue.length + s.blocked.length}</b><span>风险</span></button>
  `;

  $("mosaic").innerHTML = `
    <article class="module today">
      <p class="kicker">今日 · 8月18日</p>
      <p class="hero-num">${s.todayMeetings}<span>场上会议，另有 ${s.todayFollowUps} 项跟进尚未关闭。</span></p>
      <div class="split">
        <div><b>${s.weekMeetings}</b><p>本周会议</p></div>
        <div><b>${s.open}</b><p>未结事项</p></div>
      </div>
      <div class="day-ring">
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(243,234,212,.12)" stroke-width="6"/>
          <circle cx="36" cy="36" r="28" fill="none" stroke="#d4b04a" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${ring}"
            stroke-dashoffset="${ring * (1 - dayProgress)}" transform="rotate(-90 36 36)"/>
        </svg>
        <p>工作日过半。此刻到 17:30 收场之间，还有四场会。</p>
      </div>
    </article>
    <article class="module">
      <p class="kicker">本周节奏</p>
      <h3>${s.weekMeetings} 场会议</h3>
      <div class="week-bars viz-hide-mobile">${weekBars}</div>
      <div class="week-labels viz-hide-mobile">${weekLabels}</div>
      <p class="legend"><span>周一至周日</span><span>周二高峰</span></p>
    </article>
    <article class="module">
      <p class="kicker">流转进度</p>
      <div class="gauge">
        <div>
          <div class="num">${s.pending + s.progress}</div>
          <p class="kicker" style="margin:10px 0 0">待处理 + 在办</p>
        </div>
        <div>
          <div class="num" style="color:#7cb87c">${s.done}</div>
          <p class="kicker" style="margin:10px 0 0">已完成</p>
        </div>
      </div>
      <div class="stack viz-hide-mobile" style="--pend:${pendingShare}%;--done:${doneShare}%">
        <span></span><span></span>
      </div>
      <p class="legend"><span>${pendingShare}% 仍在流转</span><span>${doneShare}% 已清完</span></p>
    </article>
    <article class="module risk">
      <p class="kicker">风险台</p>
      <h3>待指挥处置</h3>
      <div class="risk-split">
        <div><strong>${s.overdue.length}</strong><span>逾期</span></div>
        <div><strong>${s.blocked.length}</strong><span>阻塞</span></div>
      </div>
      <ul class="risk-list">${riskItems}</ul>
    </article>
  `;
}

function upcomingTransfers() {
  return TASKS.filter((task) => task.status !== "done")
    .map((task) => ({ ...task, at: new Date(task.nextTransfer) }))
    .filter((task) => task.at.toDateString() === NOW.toDateString())
    .sort((a, b) => a.at - b.at);
}

function renderTape() {
  const items = upcomingTransfers();
  $("tape-caption").textContent = `今日还剩 ${items.length} 次流转`;

  const start = new Date(NOW);
  start.setHours(8, 0, 0, 0);
  const end = new Date(NOW);
  end.setHours(18, 30, 0, 0);
  const span = end - start;
  const nowPct = Math.min(96, Math.max(4, ((NOW - start) / span) * 100));

  const ticks = items
    .map((task) => {
      const left = Math.min(94, Math.max(3, ((task.at - start) / span) * 100));
      return `
        <button class="tick ${task.status}" style="left:${left}%" type="button" data-open="${task.id}">
          <span>${pad(task.at.getHours())}:${pad(task.at.getMinutes())}</span>
          <i></i>
        </button>
      `;
    })
    .join("");

  $("tape-track").innerHTML = `
    <div class="tape-line"></div>
    <div class="tape-now" style="left:${nowPct}%"></div>
    ${ticks}
  `;
}

function renderFilters() {
  $("filters").innerHTML = FILTERS.map(
    (filter) => `
      <button type="button" role="tab" data-filter="${filter.id}" aria-selected="${state.filter === filter.id}">
        ${filter.label}
      </button>
    `
  ).join("");
  document.querySelectorAll(".strip [data-filter]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === state.filter));
  });
}

function renderTasks() {
  const visible = TASKS.filter(matchesFilter);
  $("rail-count").textContent = `${visible.length} 项`;
  if (!visible.length) {
    $("tasks").innerHTML = `<li class="empty">当前筛选下没有事项。</li>`;
    return;
  }
  $("tasks").innerHTML = visible
    .map(
      (task) => `
        <li>
          <button class="task ${task.status}" type="button" data-open="${task.id}">
            <div class="task-top">
              <span class="status ${task.status}"><i></i>${STATUS_LABEL[task.status]}</span>
              <span class="dept">${task.dept} · ${task.id}</span>
            </div>
            <h3>${task.title}</h3>
            <div class="owner">
              <span class="avatar">${initials(task.owner)}</span>
              <span>${task.owner} · ${task.action}</span>
            </div>
            <div class="xfer">
              <span>下次流转</span>
              <time datetime="${task.nextTransfer}">${formatTransfer(task.nextTransfer)}</time>
            </div>
          </button>
        </li>
      `
    )
    .join("");
}

function openBrief(id) {
  const task = TASKS.find((item) => item.id === id);
  if (!task) return;
  state.selected = id;
  $("brief-body").innerHTML = `
    <p class="kicker">${task.dept} · ${task.id}</p>
    <h2 id="brief-title" class="rail-head" style="display:block;margin:8px 0 12px;font-family:var(--serif);font-size:2rem;font-weight:400">${task.title}</h2>
    <p class="status ${task.status}"><i></i>${STATUS_LABEL[task.status]}</p>
    <div class="xfer">
      <span>下次流转</span>
      <time datetime="${task.nextTransfer}">${formatTransfer(task.nextTransfer)}</time>
    </div>
    <p class="notes">${task.notes}</p>
    <p class="kicker" style="margin-top:22px">当前动作</p>
    <p class="notes">${task.owner} · ${task.action}</p>
    <p class="kicker" style="margin-top:22px">下一位接收人</p>
    <p class="notes">${task.nextOwner}</p>
    <ol class="chain">${task.chain.map((step) => `<li>${step}</li>`).join("")}</ol>
  `;
  $("brief").hidden = false;
  $("brief-close").focus();
}

function closeBrief() {
  $("brief").hidden = true;
  state.selected = null;
}

function onClick(event) {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filter = filter.dataset.filter;
    renderFilters();
    renderTasks();
    return;
  }
  const open = event.target.closest("[data-open]");
  if (open) openBrief(open.dataset.open);
}

function boot() {
  renderClock();
  renderMosaic();
  renderTape();
  renderFilters();
  renderTasks();
  setInterval(renderClock, 1000);
  document.addEventListener("click", onClick);
  $("brief-close").addEventListener("click", closeBrief);
  $("brief").addEventListener("click", (event) => {
    if (event.target.id === "brief") closeBrief();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBrief();
  });
}

boot();
