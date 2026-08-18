const STATUSES = [
  { id: "follow", label: "待跟进", tone: "#f4c14a" },
  { id: "progress", label: "进行中", tone: "#3ec8ff" },
  { id: "transfer", label: "流转中", tone: "#b48cff" },
  { id: "blocked", label: "已阻塞", tone: "#ff6d6a" },
  { id: "done", label: "已完成", tone: "#3ee0a2" },
];

const PEOPLE = {
  chen: { name: "陈思远", dept: "财务中心", initials: "陈", color: "#7ad3ff" },
  lin: { name: "林婉清", dept: "运营管理部", initials: "林", color: "#7ee7c4" },
  zhao: { name: "赵启明", dept: "销售一部", initials: "赵", color: "#ffb86b" },
  zhou: { name: "周予安", dept: "法务合规部", initials: "周", color: "#c9b2ff" },
  wu: { name: "吴嘉宁", dept: "产品中心", initials: "吴", color: "#ff9ec8" },
  zheng: { name: "郑浩然", dept: "采购供应部", initials: "郑", color: "#ff8f7a" },
  sun: { name: "孙悦", dept: "行政人事部", initials: "孙", color: "#8ad4d8" },
  huang: { name: "黄启程", dept: "信息技术部", initials: "黄", color: "#f4d35e" },
};

const MEETINGS = [
  { id: "ops-q3", title: "2026 Q3 经营分析会", when: "8月15日 14:00", room: "总部 18F 会议厅", open: 3 },
  { id: "east-channel", title: "华东大区渠道复盘会", when: "8月17日 10:30", room: "上海办 3号会议室", open: 2 },
  { id: "vendor-frame", title: "供应商年度框架协议评审", when: "8月14日 16:00", room: "法务楼 9F", open: 2 },
  { id: "launch-sync", title: "新品上市跨部门对齐会", when: "8月18日 09:30", room: "产品楼 战情室", open: 2 },
  { id: "office-move", title: "办公室搬迁专项会", when: "8月16日 15:30", room: "行政楼 2F", open: 3 },
  { id: "budget-kickoff", title: "年度预算编制启动会", when: "8月13日 11:00", room: "财务中心 小会议室", open: 1 },
  { id: "access-review", title: "信息权限月度评审会", when: "8月12日 16:30", room: "线上腾讯会议", open: 1 },
];

const now = () => new Date();

function atToday(hours, minutes = 0) {
  const date = now();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function atOffset(days, hours, minutes = 0) {
  const date = now();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const TASKS = [
  {
    id: "t1",
    meetingId: "ops-q3",
    status: "follow",
    title: "整理经营分析会决议清单并分发责任人",
    action: "正在核对各部门口头承诺与会议纪要是否一致",
    ownerId: "chen",
    nextTransferAt: atToday(16, 30),
    note: "财务、销售、运营三条线都要书面确认，16:30 前提交给林总办公室。",
    history: [
      { at: atOffset(-3, 16, 20), text: "会议结束，陈思远接手纪要整理" },
      { at: atOffset(-1, 11, 10), text: "销售一部补充了渠道费用口径" },
    ],
  },
  {
    id: "t2",
    meetingId: "east-channel",
    status: "follow",
    title: "跟进华东库存对账差异 186 万",
    action: "等待上海仓补传 8 月盘点明细",
    ownerId: "zhao",
    nextTransferAt: atOffset(1, 10, 0),
    note: "差异主要集中在苏州和杭州两个经销商仓，需先对齐批次号。",
    history: [
      { at: atOffset(-1, 11, 40), text: "复盘会提出差异，指定赵启明跟进" },
    ],
  },
  {
    id: "t3",
    meetingId: "office-move",
    status: "follow",
    title: "收集各部门搬迁座位与工位电源需求",
    action: "行政人事正在催收最后 3 份部门回执",
    ownerId: "sun",
    nextTransferAt: atOffset(1, 9, 30),
    note: "信息技术部与法务合规部尚未提交，影响弱电图纸定稿。",
    history: [
      { at: atOffset(-2, 16, 0), text: "专项会要求周五前收齐回执" },
    ],
  },
  {
    id: "t4",
    meetingId: "launch-sync",
    status: "follow",
    title: "确认周四跨部门对齐会出席名单",
    action: "运营管理部正在核对请假与授权代理人",
    ownerId: "lin",
    nextTransferAt: atToday(14, 0),
    note: "销售大区总若无法到场，需指定能拍板物料数量的代理人。",
    history: [
      { at: atToday(9, 40), text: "对齐会召开，会后需锁定下周评审人" },
    ],
  },
  {
    id: "t5",
    meetingId: "vendor-frame",
    status: "progress",
    title: "起草供应商框架协议修订条款",
    action: "法务正在改写账期与质量扣款条款",
    ownerId: "zhou",
    nextTransferAt: atToday(18, 0),
    note: "采购希望账期从 60 天调到 45 天，需评估对现金流的影响后再会签。",
    history: [
      { at: atOffset(-4, 17, 10), text: "评审会形成修订原则" },
      { at: atOffset(-1, 15, 20), text: "采购提交供应商反对意见摘要" },
    ],
  },
  {
    id: "t6",
    meetingId: "launch-sync",
    status: "progress",
    title: "核对新品上市物料清单与到货窗口",
    action: "产品中心对照门店陈列规范逐项勾选",
    ownerId: "wu",
    nextTransferAt: atOffset(1, 14, 0),
    note: "海报与演示机还差第二批到货确认，不能先发门店通知。",
    history: [
      { at: atToday(10, 5), text: "对齐会确认 9 月 2 日统一上架" },
    ],
  },
  {
    id: "t7",
    meetingId: "budget-kickoff",
    status: "progress",
    title: "汇总各部门预算初稿缺口",
    action: "财务中心按科目归并，标出超编项",
    ownerId: "chen",
    nextTransferAt: atOffset(2, 11, 0),
    note: "市场与信息技术两部超编明显，需会前给出压缩建议。",
    history: [
      { at: atOffset(-5, 11, 30), text: "启动会下发填报模板" },
      { at: atOffset(-1, 18, 0), text: "运营管理部完成初稿提交" },
    ],
  },
  {
    id: "t8",
    meetingId: "office-move",
    status: "progress",
    title: "编制搬迁停机窗口与系统切换时间表",
    action: "信息技术部评估周五晚切断门禁与打印服务的影响",
    ownerId: "huang",
    nextTransferAt: atOffset(1, 16, 0),
    note: "财务月结期间不能停 ERP，时间表必须避开 8 月 29 日。",
    history: [
      { at: atOffset(-2, 16, 40), text: "专项会要求输出停机窗口" },
    ],
  },
  {
    id: "t9",
    meetingId: "ops-q3",
    status: "transfer",
    title: "采购审批单转财务复核",
    action: "采购已提交，等待财务中心抽检合同附件",
    ownerId: "zheng",
    nextTransferAt: atToday(15, 0),
    note: "三份超预算申请需经营分析会纪要作为附件，缺一页都会退回。",
    history: [
      { at: atOffset(-3, 17, 0), text: "经营会原则同意追加采购" },
      { at: atToday(9, 20), text: "郑浩然把审批单转入财务队列" },
    ],
  },
  {
    id: "t10",
    meetingId: "east-channel",
    status: "transfer",
    title: "渠道政策签批流转至大区总",
    action: "销售一部已完成草案，等待大区总书面确认",
    ownerId: "zhao",
    nextTransferAt: atOffset(1, 9, 0),
    note: "政策涉及返利上限，必须大区总本人确认，不能口头代替。",
    history: [
      { at: atOffset(-1, 12, 10), text: "复盘会要求 48 小时内完成签批" },
    ],
  },
  {
    id: "t11",
    meetingId: "access-review",
    status: "transfer",
    title: "ERP 权限开通申请转信息安全复核",
    action: "信息技术部已填权限矩阵，等待安全岗会签",
    ownerId: "huang",
    nextTransferAt: atToday(17, 30),
    note: "新品项目组 6 人需要临时出库权限，有效期只开到 9 月 15 日。",
    history: [
      { at: atOffset(-6, 17, 0), text: "月度评审会批准临时权限原则" },
      { at: atToday(11, 15), text: "黄启程提交安全复核单" },
    ],
  },
  {
    id: "t12",
    meetingId: "office-move",
    status: "blocked",
    title: "装修图纸待物业批复，搬迁日期无法锁定",
    action: "运营管理部每日催问园区物业工程部",
    ownerId: "lin",
    nextTransferAt: atOffset(-1, 17, 0),
    note: "物业要求补充消防喷淋点位说明，原施工方要到周三才能改图。",
    history: [
      { at: atOffset(-2, 16, 10), text: "专项会把图纸批复列为关键路径" },
      { at: atOffset(-1, 17, 0), text: "约定物业反馈时点已过，事项阻塞" },
    ],
  },
  {
    id: "t13",
    meetingId: "vendor-frame",
    status: "blocked",
    title: "年度框架协议卡在外部律师意见",
    action: "法务合规部等待外所对跨境条款的书面回复",
    ownerId: "zhou",
    nextTransferAt: atOffset(1, 11, 0),
    note: "外所反馈延期，内部会签无法继续。已升级法务总监协调。",
    history: [
      { at: atOffset(-4, 17, 40), text: "评审会决定送外所复核" },
      { at: atOffset(-1, 9, 30), text: "外所申请延期，事项标记阻塞" },
    ],
  },
  {
    id: "t14",
    meetingId: "launch-sync",
    status: "done",
    title: "发布会场地意向书已盖章回传",
    action: "场地预定闭环，合同原件交行政归档",
    ownerId: "wu",
    nextTransferAt: null,
    completedAt: atOffset(-1, 16, 40),
    note: "国家会展中心东厅意向书已双方盖章。",
    history: [
      { at: atOffset(-2, 11, 0), text: "产品中心提交场地比选" },
      { at: atOffset(-1, 16, 40), text: "行政完成盖章并归档" },
    ],
  },
  {
    id: "t15",
    meetingId: "east-channel",
    status: "done",
    title: "7 月销售周会纪要已归档",
    action: "纪要与到会签字表已入知识库",
    ownerId: "zhao",
    nextTransferAt: null,
    completedAt: atOffset(-3, 18, 10),
    note: "历史事项补归档，便于华东复盘会引用。",
    history: [
      { at: atOffset(-3, 18, 10), text: "赵启明完成归档" },
    ],
  },
  {
    id: "t16",
    meetingId: "ops-q3",
    status: "done",
    title: "Q2 费用超支说明已会签完毕",
    action: "财务、销售、运营三方签字齐备",
    ownerId: "chen",
    nextTransferAt: null,
    completedAt: atOffset(-4, 15, 20),
    note: "作为 Q3 经营分析会附件使用。",
    history: [
      { at: atOffset(-4, 15, 20), text: "会签完成并附入经营会材料" },
    ],
  },
];

const state = {
  meetingId: "all",
  ownerId: "all",
  query: "",
  activeLane: "follow",
};

const els = {
  clock: document.getElementById("live-clock"),
  meetings: document.getElementById("stat-meetings"),
  meetingsHint: document.getElementById("stat-meetings-hint"),
  open: document.getElementById("stat-open"),
  today: document.getElementById("stat-today"),
  blocked: document.getElementById("stat-blocked"),
  rate: document.getElementById("stat-rate"),
  rateHint: document.getElementById("stat-rate-hint"),
  meetingRail: document.getElementById("meeting-rail"),
  ownerFilter: document.getElementById("owner-filter"),
  search: document.getElementById("search"),
  laneTabs: document.getElementById("lane-tabs"),
  board: document.getElementById("board"),
  drawer: document.getElementById("drawer"),
  drawerTitle: document.getElementById("drawer-title"),
  drawerKicker: document.getElementById("drawer-kicker"),
  drawerBody: document.getElementById("drawer-body"),
  drawerClose: document.getElementById("drawer-close"),
  backdrop: document.getElementById("drawer-backdrop"),
};

function meetingById(id) {
  return MEETINGS.find((item) => item.id === id);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatClock(date) {
  const week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日 周${week} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTransfer(iso) {
  if (!iso) return { time: "已闭环", remain: "无需再次流转", urgency: "done" };
  const date = new Date(iso);
  const current = now();
  const diff = date.getTime() - current.getTime();
  const minutes = Math.round(diff / 60000);
  let time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (isSameDay(date, current)) time = `今天 ${time}`;
  else if (isSameDay(date, new Date(current.getTime() + 86400000))) time = `明天 ${time}`;
  else time = `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;

  let remain;
  let urgency = "later";
  if (minutes < 0) {
    const late = Math.abs(minutes);
    remain = late >= 60 ? `已逾期 ${Math.floor(late / 60)} 小时 ${late % 60} 分` : `已逾期 ${late} 分钟`;
    urgency = "overdue";
  } else if (minutes < 120) {
    remain = minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分后流转` : `${minutes} 分钟后流转`;
    urgency = "soon";
  } else {
    remain = minutes >= 1440
      ? `${Math.floor(minutes / 1440)} 天后流转`
      : `${Math.floor(minutes / 60)} 小时后流转`;
  }
  return { time, remain, urgency };
}

function filteredTasks() {
  const query = state.query.trim().toLowerCase();
  return TASKS.filter((task) => {
    if (state.meetingId !== "all" && task.meetingId !== state.meetingId) return false;
    if (state.ownerId !== "all" && task.ownerId !== state.ownerId) return false;
    if (!query) return true;
    const owner = PEOPLE[task.ownerId];
    const meeting = meetingById(task.meetingId);
    const hay = [task.title, task.action, owner.name, owner.dept, meeting.title].join(" ").toLowerCase();
    return hay.includes(query);
  });
}

function todayLabel() {
  const date = now();
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function renderStats(tasks) {
  const open = TASKS.filter((task) => task.status !== "done").length;
  const today = TASKS.filter((task) => task.nextTransferAt && isSameDay(new Date(task.nextTransferAt), now())).length;
  const blocked = TASKS.filter((task) => task.status === "blocked").length;
  const done = TASKS.filter((task) => task.status === "done").length;
  const todayMeetings = MEETINGS.filter((item) => item.when.startsWith(todayLabel())).length;
  els.meetings.textContent = String(MEETINGS.length);
  els.meetingsHint.textContent = todayMeetings ? `今日现场 ${todayMeetings} 场` : "本周已排期会议";
  els.open.textContent = String(open);
  els.today.textContent = String(today);
  els.blocked.textContent = String(blocked);
  els.rate.textContent = `${Math.round((done / TASKS.length) * 100)}%`;
  els.rateHint.textContent = `已办结 ${done} / ${TASKS.length}，当前筛选 ${tasks.length} 条`;
}

function renderMeetings() {
  const chips = [
    `<button class="meeting-chip ${state.meetingId === "all" ? "active" : ""}" data-meeting="all">
      <h3>全部会议</h3>
      <div class="meeting-meta"><span>${MEETINGS.length} 场</span><span>${TASKS.length} 项</span></div>
    </button>`,
    ...MEETINGS.map((meeting) => {
      const count = TASKS.filter((task) => task.meetingId === meeting.id && task.status !== "done").length;
      return `<button class="meeting-chip ${state.meetingId === meeting.id ? "active" : ""}" data-meeting="${meeting.id}">
        <h3>${meeting.title}</h3>
        <div class="meeting-meta"><span>${meeting.when}</span><span>未闭环 ${count}</span></div>
      </button>`;
    }),
  ];
  els.meetingRail.innerHTML = chips.join("");
}

function renderOwners() {
  const used = [...new Set(TASKS.map((task) => task.ownerId))];
  const chips = [
    `<button class="owner-chip ${state.ownerId === "all" ? "active" : ""}" data-owner="all">全部负责人</button>`,
    ...used.map((id) => {
      const person = PEOPLE[id];
      return `<button class="owner-chip ${state.ownerId === id ? "active" : ""}" data-owner="${id}">${person.name}</button>`;
    }),
  ];
  els.ownerFilter.innerHTML = chips.join("");
}

function renderTabs() {
  els.laneTabs.innerHTML = STATUSES.map((status) => {
    const count = filteredTasks().filter((task) => task.status === status.id).length;
    return `<button class="lane-tab ${state.activeLane === status.id ? "active" : ""}" data-lane="${status.id}">
      ${status.label} ${count}
    </button>`;
  }).join("");
}

function cardMarkup(task) {
  const status = STATUSES.find((item) => item.id === task.status);
  const owner = PEOPLE[task.ownerId];
  const meeting = meetingById(task.meetingId);
  const transfer = formatTransfer(task.nextTransferAt);
  return `<button class="card" data-task="${task.id}" style="--lane:${status.tone}">
    <div class="card-top">
      <p class="card-meeting">${meeting.title}</p>
      <span class="status-pill">${status.label}</span>
    </div>
    <h3>${task.title}</h3>
    <div class="action">
      <p class="action-label">当前动作</p>
      <p>${task.action}</p>
    </div>
    <div class="transfer ${transfer.urgency === "overdue" ? "is-overdue" : ""} ${transfer.urgency === "soon" ? "is-soon" : ""}">
      <p class="transfer-label">下次流转时间</p>
      <p class="transfer-time">${transfer.time}</p>
      <p class="transfer-remain">${transfer.remain}</p>
    </div>
    <div class="owner-row">
      <span class="avatar" style="background:${owner.color}">${owner.initials}</span>
      <div>
        <p class="owner-name">${owner.name}</p>
        <p class="owner-meta">${owner.dept}</p>
      </div>
    </div>
  </button>`;
}

function renderBoard() {
  const tasks = filteredTasks();
  renderStats(tasks);
  renderTabs();
  els.board.innerHTML = STATUSES.map((status) => {
    const laneTasks = tasks.filter((task) => task.status === status.id);
    const body = laneTasks.length
      ? laneTasks.map(cardMarkup).join("")
      : `<p class="empty">该列暂无事项</p>`;
    return `<section class="lane" data-lane="${status.id}" style="--lane:${status.tone}">
      <header class="lane-head">
        <div class="lane-title"><span class="lane-dot"></span><h2>${status.label}</h2></div>
        <span class="lane-count">${String(laneTasks.length).padStart(2, "0")}</span>
      </header>
      <div class="cards">${body}</div>
    </section>`;
  }).join("");
  observeLanes();
}

function openDrawer(taskId) {
  const task = TASKS.find((item) => item.id === taskId);
  if (!task) return;
  const status = STATUSES.find((item) => item.id === task.status);
  const owner = PEOPLE[task.ownerId];
  const meeting = meetingById(task.meetingId);
  const transfer = formatTransfer(task.nextTransferAt);
  els.drawerKicker.textContent = `${meeting.title} · ${status.label}`;
  els.drawerTitle.textContent = task.title;
  els.drawerBody.innerHTML = `
    <div class="detail-grid">
      <div class="detail-box">
        <p class="label">下次流转时间</p>
        <p class="big">${transfer.time}</p>
        <p class="owner-meta">${transfer.remain}</p>
      </div>
      <div class="detail-box">
        <p class="label">负责人 / 当前动作</p>
        <p>${owner.name} · ${owner.dept}</p>
        <p class="owner-meta">${task.action}</p>
      </div>
      <div class="detail-box">
        <p class="label">会议现场</p>
        <p>${meeting.title}</p>
        <p class="owner-meta">${meeting.when} · ${meeting.room}</p>
      </div>
      <div class="detail-box">
        <p class="label">备注</p>
        <p>${task.note}</p>
      </div>
    </div>
    <div class="timeline">
      <h3>流转记录</h3>
      ${task.history.map((item) => {
        const stamp = formatTransfer(item.at).time;
        return `<div class="tl-item"><p>${item.text}</p><p class="owner-meta">${stamp}</p></div>`;
      }).join("")}
    </div>
  `;
  els.drawer.hidden = false;
  els.backdrop.hidden = false;
}

function closeDrawer() {
  els.drawer.hidden = true;
  els.backdrop.hidden = true;
}

function updateClock() {
  els.clock.textContent = formatClock(now());
}

function scrollToLane(id) {
  const lane = els.board.querySelector(`[data-lane="${id}"]`);
  if (lane) lane.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
}

function bind() {
  els.meetingRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meeting]");
    if (!button) return;
    state.meetingId = button.dataset.meeting;
    renderMeetings();
    renderBoard();
  });

  els.ownerFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-owner]");
    if (!button) return;
    state.ownerId = button.dataset.owner;
    renderOwners();
    renderBoard();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderBoard();
  });

  els.laneTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lane]");
    if (!button) return;
    state.activeLane = button.dataset.lane;
    renderTabs();
    scrollToLane(state.activeLane);
  });

  els.board.addEventListener("click", (event) => {
    const card = event.target.closest("[data-task]");
    if (card) openDrawer(card.dataset.task);
  });

  els.drawerClose.addEventListener("click", closeDrawer);
  els.backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

}

const laneObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    state.activeLane = visible.target.dataset.lane;
    renderTabs();
  },
  { root: els.board, threshold: 0.55 }
);

function observeLanes() {
  laneObserver.disconnect();
  els.board.querySelectorAll(".lane").forEach((lane) => laneObserver.observe(lane));
}

updateClock();
setInterval(updateClock, 30000);

bind();
renderMeetings();
renderOwners();
renderBoard();
