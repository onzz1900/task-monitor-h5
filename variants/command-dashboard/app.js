const NOW = new Date("2026-08-18T11:42:00");

const TASKS = [
  {
    id: "NP-1842",
    title: "Q3 board packet review",
    dept: "Finance",
    status: "progress",
    owner: "Marcus Hale",
    action: "Compiling exhibit pack for the 15:00 working session",
    nextTransfer: "2026-08-18T15:00:00",
    nextOwner: "Helena Cho",
    notes:
      "Board wants the cash-bridge and the two delayed close items called out on page one. Finance owns the pack until the 15:00 transfer to Corporate Secretary.",
    chain: [
      "Marcus Hale collected variance notes from Controllers at 08:40",
      "Helena Cho receives the locked PDF at 15:00 for circulation",
    ],
  },
  {
    id: "NP-1847",
    title: "Acme renewal handoff",
    dept: "Sales",
    status: "pending",
    owner: "Priya Shah",
    action: "Waiting on commercial terms from Deal Desk",
    nextTransfer: "2026-08-18T13:15:00",
    nextOwner: "Owen Blake",
    notes:
      "Renewal is $1.4M, 24 months. Deal Desk still owes the discount memo before Client Delivery can take the kickoff.",
    chain: [
      "Priya Shah opened the renewal room yesterday 17:10",
      "Owen Blake takes the signed order at 13:15",
    ],
  },
  {
    id: "NP-1851",
    title: "Vendor SOW legal transfer",
    dept: "Legal",
    status: "blocked",
    owner: "Elena Voss",
    action: "Held — counterparty has not returned the redline",
    nextTransfer: "2026-08-18T14:30:00",
    nextOwner: "Jonah Park",
    notes:
      "Helios Labs still has the limitation-of-liability clause. Legal cannot move the SOW to Product until the countersignature lands.",
    chain: [
      "Elena Voss sent the third request at 09:05",
      "Jonah Park is queued for implementation once Legal clears the hold",
    ],
  },
  {
    id: "NP-1833",
    title: "Security exception follow-up",
    dept: "Product",
    status: "overdue",
    owner: "Jonah Park",
    action: "Risk committee asked for a written exception path",
    nextTransfer: "2026-08-17T16:00:00",
    nextOwner: "Elena Voss",
    notes:
      "The temporary vendor access was supposed to transfer to Legal yesterday at 16:00. The write-up is still incomplete.",
    chain: [
      "Jonah Park missed the 16:00 Monday transfer",
      "Elena Voss cannot file the exception until the memo arrives",
    ],
  },
  {
    id: "NP-1855",
    title: "Client kickoff debrief",
    dept: "Client Delivery",
    status: "progress",
    owner: "Amelia Ortiz",
    action: "Drafting action list from this morning’s call",
    nextTransfer: "2026-08-18T16:45:00",
    nextOwner: "Priya Shah",
    notes:
      "Northline led the Harbor Freight kickoff. Four follow-ups need owners before the account is handed back to Sales for executive sponsor mapping.",
    chain: [
      "Amelia Ortiz ran the 09:30 kickoff",
      "Priya Shah receives the sponsor map at 16:45",
    ],
  },
  {
    id: "NP-1828",
    title: "Invoice dispute escalation",
    dept: "Finance",
    status: "overdue",
    owner: "Marcus Hale",
    action: "Collections is waiting on a credit memo decision",
    nextTransfer: "2026-08-17T11:30:00",
    nextOwner: "Helena Cho",
    notes:
      "Westbridge queried two July invoices. The credit memo should have moved to the CFO office yesterday morning.",
    chain: [
      "Accounts receivable flagged the dispute Friday",
      "Helena Cho expected the recommendation at 11:30 Monday",
    ],
  },
  {
    id: "NP-1859",
    title: "Weekly ops sync follow-ups",
    dept: "Product",
    status: "progress",
    owner: "Jonah Park",
    action: "Assigning owners for the three open platform items",
    nextTransfer: "2026-08-18T15:20:00",
    nextOwner: "Amelia Ortiz",
    notes:
      "Ops sync closed at 10:15. Three items still lack a receiving owner in Client Delivery.",
    chain: [
      "Jonah Park captured notes live in the room",
      "Amelia Ortiz takes delivery items at 15:20",
    ],
  },
  {
    id: "NP-1861",
    title: "Partnership MSA transfer",
    dept: "Legal",
    status: "pending",
    owner: "Elena Voss",
    action: "Queued behind the Helios SOW",
    nextTransfer: "2026-08-19T09:00:00",
    nextOwner: "Priya Shah",
    notes:
      "Brightlane MSA is ready for commercial review once Legal is off the blocked SOW.",
    chain: [
      "Template approved last Thursday",
      "Priya Shah reviews commercials Wednesday 09:00",
    ],
  },
  {
    id: "NP-1840",
    title: "Facilities lease amendment",
    dept: "Legal",
    status: "blocked",
    owner: "Helena Cho",
    action: "Landlord counsel has not returned comments",
    nextTransfer: "2026-08-18T17:00:00",
    nextOwner: "Marcus Hale",
    notes:
      "The Mission Street expansion rider is frozen. Finance cannot book the occupancy accrual until Legal releases the amendment.",
    chain: [
      "Helena Cho sent a chaser at 08:20",
      "Marcus Hale is scheduled to receive numbers at 17:00 if the hold lifts",
    ],
  },
  {
    id: "NP-1864",
    title: "Q4 hiring plan review",
    dept: "People",
    status: "pending",
    owner: "Noah Kim",
    action: "Hold for Thursday’s workforce committee",
    nextTransfer: "2026-08-20T11:30:00",
    nextOwner: "Helena Cho",
    notes:
      "Headcount plan is drafted. Transfer to Finance is locked for Thursday so the committee can see loaded cost.",
    chain: [
      "Noah Kim closed manager intake yesterday",
      "Helena Cho receives the loaded model Thursday 11:30",
    ],
  },
  {
    id: "NP-1836",
    title: "New-hire onboarding checkpoint",
    dept: "People",
    status: "done",
    owner: "Noah Kim",
    action: "Transferred to hiring managers",
    nextTransfer: "2026-08-17T14:00:00",
    nextOwner: "Department leads",
    notes:
      "August cohort checkpoint completed. Laptop, badge, and buddy assignments all moved on time.",
    chain: [
      "People closed the 14:00 Monday transfer",
      "Managers now own week-one agendas",
    ],
  },
  {
    id: "NP-1821",
    title: "Product roadmap alignment",
    dept: "Product",
    status: "done",
    owner: "Jonah Park",
    action: "Notes circulated to Sales and Delivery",
    nextTransfer: "2026-08-16T17:30:00",
    nextOwner: "Priya Shah",
    notes:
      "Q4 theme lock is complete. Sales received the public narrative on Sunday evening.",
    chain: [
      "Working session closed Saturday",
      "Priya Shah accepted the narrative Sunday 17:30",
    ],
  },
  {
    id: "NP-1866",
    title: "Budget variance standup",
    dept: "Finance",
    status: "pending",
    owner: "Helena Cho",
    action: "Agenda set for tomorrow’s 10:00 room",
    nextTransfer: "2026-08-19T10:00:00",
    nextOwner: "Marcus Hale",
    notes:
      "Two cost centers are still above plan. The standup transfers the working file to Controllers after the room.",
    chain: [
      "Helena Cho published the pre-read at 07:50",
      "Marcus Hale takes actions at 10:00 Wednesday",
    ],
  },
  {
    id: "NP-1868",
    title: "Customer health review",
    dept: "Client Delivery",
    status: "progress",
    owner: "Amelia Ortiz",
    action: "Preparing the at-risk account brief",
    nextTransfer: "2026-08-18T17:30:00",
    nextOwner: "Priya Shah",
    notes:
      "Three accounts slipped below the health threshold. Sales needs the brief before close of day.",
    chain: [
      "Delivery scored accounts this morning",
      "Priya Shah receives the brief at 17:30",
    ],
  },
];

const WEEK_MEETINGS = [
  { day: "Mon", count: 3 },
  { day: "Tue", count: 6 },
  { day: "Wed", count: 4 },
  { day: "Thu", count: 2 },
  { day: "Fri", count: 2 },
  { day: "Sat", count: 1 },
  { day: "Sun", count: 0 },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "live", label: "In motion" },
  { id: "blocked", label: "Blocked" },
  { id: "overdue", label: "Overdue" },
  { id: "done", label: "Done" },
];

const STATUS_LABEL = {
  progress: "In progress",
  pending: "Pending",
  blocked: "Blocked",
  overdue: "Overdue",
  done: "Done",
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
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTransfer(iso) {
  const date = new Date(iso);
  const sameDay = date.toDateString() === NOW.toDateString();
  const yesterday = new Date(NOW);
  yesterday.setDate(NOW.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (sameDay) return `${time} · today`;
  if (isYesterday) return `${time} · yesterday`;
  const day = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${time} · ${day}`;
}

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function matchesFilter(task) {
  if (state.filter === "all") return true;
  if (state.filter === "live") return task.status === "progress" || task.status === "pending";
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
  $("live-date").textContent = `${formatDate(NOW)} · Live floor`;
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

  $("mosaic").innerHTML = `
    <article class="module today">
      <p class="kicker">Today · 18 Aug</p>
      <p class="hero-num">${s.todayMeetings}<span>Meetings on the floor, with ${s.todayFollowUps} follow-ups still open.</span></p>
      <div class="split">
        <div><b>${s.weekMeetings}</b><p>Meetings this week</p></div>
        <div><b>${s.open}</b><p>Open work items</p></div>
      </div>
      <div class="day-ring">
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(243,234,212,.12)" stroke-width="6"/>
          <circle cx="36" cy="36" r="28" fill="none" stroke="#d4b04a" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${ring}"
            stroke-dashoffset="${ring * (1 - dayProgress)}" transform="rotate(-90 36 36)"/>
        </svg>
        <p>Workday is halfway. Four rooms still sit between now and the 17:30 close.</p>
      </div>
    </article>
    <article class="module">
      <p class="kicker">Week spine</p>
      <h3>${s.weekMeetings} meetings</h3>
      <div class="week-bars viz-hide-mobile">${weekBars}</div>
      <div class="week-labels viz-hide-mobile">${weekLabels}</div>
      <p class="legend"><span>Mon–Sun</span><span>Tue peak</span></p>
    </article>
    <article class="module">
      <p class="kicker">Throughput</p>
      <div class="gauge">
        <div>
          <div class="num">${s.pending + s.progress}</div>
          <p class="kicker" style="margin:10px 0 0">Pending + live</p>
        </div>
        <div>
          <div class="num" style="color:#7cb87c">${s.done}</div>
          <p class="kicker" style="margin:10px 0 0">Done</p>
        </div>
      </div>
      <div class="stack viz-hide-mobile" style="--pend:${pendingShare}%;--done:${doneShare}%">
        <span></span><span></span>
      </div>
      <p class="legend"><span>${pendingShare}% still moving</span><span>${doneShare}% cleared</span></p>
    </article>
    <article class="module risk">
      <p class="kicker">Risk desk</p>
      <h3>Needs command</h3>
      <div class="risk-split">
        <div><strong>${s.overdue.length}</strong><span>Overdue</span></div>
        <div><strong>${s.blocked.length}</strong><span>Blocked</span></div>
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
  $("tape-caption").textContent = `${items.length} handoffs remaining today`;

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
}

function renderTasks() {
  const visible = TASKS.filter(matchesFilter);
  $("rail-count").textContent = `${visible.length} items`;
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
              <span>Next transfer</span>
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
      <span>Next transfer</span>
      <time datetime="${task.nextTransfer}">${formatTransfer(task.nextTransfer)}</time>
    </div>
    <p class="notes">${task.notes}</p>
    <p class="kicker" style="margin-top:22px">Current action</p>
    <p class="notes">${task.owner} · ${task.action}</p>
    <p class="kicker" style="margin-top:22px">Receives next</p>
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
