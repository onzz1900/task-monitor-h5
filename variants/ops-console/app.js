(function () {
  const data = window.OPS_DESKTOP;
  if (!data || !Array.isArray(data.tasks) || !data.tasks.length) return;

  const now = new Date(data.now);
  const TZ = "Asia/Shanghai";
  const FOLLOW = data.followStatuses || ["流转中", "待跟进", "已阻塞", "等待中"];

  const TYPE_LABEL = {
    review: "审阅",
    seal: "用印",
    audit: "巡检",
    launch: "上市",
    aftersales: "售后",
    weekly: "周行动",
    recon: "对账",
  };

  const STATUS_CLASS = {
    进行中: "in-review",
    流转中: "transferring",
    待跟进: "pending",
    已阻塞: "blocked",
    等待中: "waiting",
    已完成: "done",
  };

  const AVATAR_HUE = {
    limin: 230,
    zhangkai: 265,
    dianzhang: 160,
    wangqian: 38,
    zhijian: 200,
    zhouqi: 320,
    caiwu: 48,
  };

  const state = {
    view: "all",
    window: "all",
    status: null,
    query: "",
    selected: null,
  };

  const els = {
    rows: document.getElementById("rows"),
    cards: document.getElementById("cards"),
    search: document.getElementById("search"),
    result: document.getElementById("result-count"),
    drawer: document.getElementById("drawer"),
    backdrop: document.getElementById("backdrop"),
    sidebar: document.getElementById("sidebar"),
    scrim: document.getElementById("scrim"),
    menu: document.getElementById("menu-btn"),
  };

  if (!els.rows || !els.cards) return;

  function person(id) {
    return data.people[id] || { name: "—", role: "", initials: "·" };
  }

  function meeting(id) {
    return data.meetings.find((m) => m.id === id) || null;
  }

  function avatarStyle(id) {
    const hue = AVATAR_HUE[id] ?? 220;
    return `background:hsla(${hue},55%,18%,1);color:hsla(${hue},80%,78%,1)`;
  }

  function avatarHtml(id) {
    const p = person(id);
    return `<span class="avatar" style="${avatarStyle(id)}" title="${p.name} · ${p.role}">${p.initials}</span>`;
  }

  function tzParts(d) {
    const fmt = new Intl.DateTimeFormat("zh-CN", {
      timeZone: TZ,
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const map = {};
    for (const part of fmt.formatToParts(d)) {
      if (part.type !== "literal") map[part.type] = part.value;
    }
    return map;
  }

  function sameShanghaiDay(a, b) {
    const pa = tzParts(a);
    const pb = tzParts(b);
    return pa.month === pb.month && pa.day === pb.day;
  }

  function fmtStamp(iso, fallback) {
    if (!iso) return fallback || "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return fallback || "—";
    const p = tzParts(d);
    if (sameShanghaiDay(d, now)) return `今天 ${p.hour}:${p.minute}`;
    const weekdays = { 周日: "周日", 周一: "周一", 周二: "周二", 周三: "周三", 周四: "周四", 周五: "周五", 周六: "周六" };
    const wd = weekdays[p.weekday] || p.weekday;
    return `${wd} ${p.hour}:${p.minute}`;
  }

  function minutesUntil(iso) {
    return Math.round((new Date(iso) - now) / 60000);
  }

  function transferTone(task) {
    if (task.status === "已完成") return "done";
    const mins = minutesUntil(task.nextTransferAt);
    if (mins < 0) return "over";
    if (mins <= 120) return "now";
    return "later";
  }

  function relativeTransfer(task) {
    if (task.status === "已完成") return "已结束";
    const mins = minutesUntil(task.nextTransferAt);
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const clock = h > 0 ? `${h}小时${m}分` : `${m}分钟`;
    if (mins < 0) return `已超时 ${clock}`;
    if (mins === 0) return "现在";
    return `${clock}后`;
  }

  function isFollow(task) {
    return FOLLOW.indexOf(task.status) !== -1;
  }

  function isDueNow(task) {
    if (task.status === "已完成") return false;
    return minutesUntil(task.nextTransferAt) <= 120;
  }

  function matchesView(task) {
    const view = state.view;
    if (view === "all" || view === "open") return true;
    if (view === "due-now") return isDueNow(task);
    if (view === "blocked") return task.status === "已阻塞";
    if (view === "done") return task.status === "已完成";
    if (view.startsWith("type:")) return task.type === view.slice(5);
    return true;
  }

  function matchesWindow(task) {
    if (state.window === "all") return true;
    if (task.status === "已完成") return state.window !== "overdue";
    const tone = transferTone(task);
    if (state.window === "overdue") return tone === "over";
    if (state.window === "today") return sameShanghaiDay(new Date(task.nextTransferAt), now);
    return true;
  }

  function matchesQuery(task) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const owner = person(task.owner);
    const meet = meeting(task.meeting);
    const hay = [
      task.id,
      task.title,
      task.action,
      task.region,
      TYPE_LABEL[task.type],
      task.status,
      owner.name,
      meet && meet.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function visibleTasks() {
    return data.tasks
      .filter((t) => matchesView(t) && matchesWindow(t) && (!state.status || t.status === state.status) && matchesQuery(t))
      .slice()
      .sort((a, b) => {
        if (a.status === "已完成" && b.status !== "已完成") return 1;
        if (b.status === "已完成" && a.status !== "已完成") return -1;
        return new Date(a.nextTransferAt) - new Date(b.nextTransferAt);
      });
  }

  function deriveStats() {
    const todayMeetings = data.tasks.filter((t) => t.meetingFlag === "today").length;
    const weekMeetings = data.tasks.filter((t) => t.meetingFlag === "today" || t.meetingFlag === "week").length;
    const pending = data.tasks.filter(isFollow).length;
    const done = data.tasks.filter((t) => t.status === "已完成").length;
    const soon = data.tasks.filter(isDueNow).length;
    const blocked = data.tasks.filter((t) => t.status === "已阻塞").length;
    return { todayMeetings, weekMeetings, pending, done, soon, blocked };
  }

  function renderStats() {
    const stats = deriveStats();
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };
    set("stat-today", stats.todayMeetings);
    set("stat-week", stats.weekMeetings);
    set("stat-pending", stats.pending);
    set("stat-done", stats.done);
    const due = document.querySelector('[data-count="due-now"]');
    const open = document.querySelector('[data-count="open"]');
    const blocked = document.querySelector('[data-count="blocked"]');
    const done = document.querySelector('[data-count="done"]');
    if (due) due.textContent = String(stats.soon);
    if (open) open.textContent = String(data.tasks.length);
    if (blocked) blocked.textContent = String(stats.blocked);
    if (done) done.textContent = String(stats.done);
  }

  function transferCell(task) {
    const tone = transferTone(task);
    const next = person(task.nextTransferTo);
    const when = task.status === "已完成" ? "已结束" : task.nextLabel || fmtStamp(task.nextTransferAt);
    const rel = task.status === "已完成" ? "本周已关闭" : `${relativeTransfer(task)} → ${next.name}`;
    return `
      <div class="xfer is-${tone}">
        <div class="xfer-kicker">下次流转</div>
        <div class="xfer-when">${when}</div>
        <div class="xfer-rel">${rel}</div>
      </div>
    `;
  }

  function renderRows() {
    const tasks = visibleTasks();
    els.result.textContent = `${tasks.length} 条`;

    if (!tasks.length) {
      els.rows.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="empty"><b>没有匹配的任务</b>请清空筛选或换一个队列。</div></td></tr>`;
      els.cards.innerHTML = `<div class="empty"><b>没有匹配的任务</b>请清空筛选或换一个队列。</div>`;
      return;
    }

    els.rows.innerHTML = tasks
      .map((task) => {
        const owner = person(task.owner);
        const meet = meeting(task.meeting);
        const selected = state.selected === task.id ? " is-selected" : "";
        const statusClass = STATUS_CLASS[task.status] || "pending";
        return `
          <tr class="${selected}" data-id="${task.id}">
            <td class="id">${task.id}</td>
            <td>
              <div class="task-title">${task.title}</div>
              <div class="task-region">${task.region}</div>
            </td>
            <td>
              <span class="chip type-${task.type}"><span class="swatch"></span>${TYPE_LABEL[task.type]}</span>
            </td>
            <td>
              <span class="chip status-${statusClass}">${task.status}</span>
            </td>
            <td>
              <div class="owner">
                ${avatarHtml(task.owner)}
                <div>
                  <div class="owner-name">${owner.name} · ${owner.role}</div>
                  <div class="owner-action">${task.action}</div>
                </div>
              </div>
            </td>
            <td class="col-xfer">${transferCell(task)}</td>
            <td>
              <div class="meet-name">${meet ? meet.title : "无关联会议"}</div>
              <div class="meet-time">${meet ? `${fmtStamp(meet.when)} · ${meet.room}` : "—"}</div>
            </td>
          </tr>
        `;
      })
      .join("");

    els.cards.innerHTML = tasks
      .map((task) => {
        const owner = person(task.owner);
        const selected = state.selected === task.id ? " is-selected" : "";
        const statusClass = STATUS_CLASS[task.status] || "pending";
        return `
          <article class="card${selected}" data-id="${task.id}">
            <div class="card-top">
              <span class="id">${task.id}</span>
              <span class="chip status-${statusClass}">${task.status}</span>
              <span class="chip type-${task.type}"><span class="swatch"></span>${TYPE_LABEL[task.type]}</span>
            </div>
            ${transferCell(task)}
            <div class="card-title">${task.title}</div>
            <div class="card-owner">${owner.name} · ${task.action}</div>
          </article>
        `;
      })
      .join("");
  }

  function openDrawer(id) {
    const task = data.tasks.find((t) => t.id === id);
    if (!task || !els.drawer) return;
    state.selected = id;
    const owner = person(task.owner);
    const next = person(task.nextTransferTo);
    const meet = meeting(task.meeting);
    const tone = transferTone(task);
    const statusClass = STATUS_CLASS[task.status] || "pending";
    const when = task.status === "已完成" ? "已结束" : task.nextLabel || fmtStamp(task.nextTransferAt);

    els.drawer.classList.add("is-open");
    els.backdrop.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.drawer.innerHTML = `
      <div class="drawer-head">
        <span class="id">${task.id}</span>
        <span class="chip status-${statusClass}">${task.status}</span>
        <button class="filter-chip" id="close-drawer" type="button">关闭</button>
      </div>
      <div class="drawer-body">
        <h2 class="drawer-title">${task.title}</h2>
        <div class="xfer-hero is-${tone}">
          <div class="xfer-hero-k">下次流转时间</div>
          <div class="xfer-hero-v">${when}</div>
          <div class="xfer-rel">${relativeTransfer(task)} · 交给 ${next.name}（${next.role}）</div>
        </div>
        <div class="meta-grid">
          <div class="meta-cell">
            <div class="meta-k">负责人</div>
            <div class="meta-v who">${avatarHtml(task.owner)} ${owner.name}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">类型</div>
            <div class="meta-v">${TYPE_LABEL[task.type]}</div>
          </div>
          <div class="meta-cell span">
            <div class="meta-k">当前动作</div>
            <div class="meta-v">${task.action}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">会议</div>
            <div class="meta-v">${meet ? meet.title : "无关联会议"}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">时间 / 地点</div>
            <div class="meta-v">${meet ? `${fmtStamp(meet.when)} · ${meet.room}` : "—"}</div>
          </div>
        </div>
        <p class="notes">${task.result || "暂无补充说明。"}</p>
      </div>
    `;
    document.getElementById("close-drawer").addEventListener("click", closeDrawer);
    renderRows();
  }

  function closeDrawer() {
    state.selected = null;
    if (els.drawer) {
      els.drawer.classList.remove("is-open");
      els.drawer.setAttribute("aria-hidden", "true");
    }
    if (els.backdrop) els.backdrop.classList.remove("is-open");
    renderRows();
  }

  function closeMobileNav() {
    if (els.sidebar) els.sidebar.classList.remove("is-open");
    if (els.scrim) els.scrim.classList.remove("is-open");
  }

  function bind() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.view = btn.dataset.view;
        closeMobileNav();
        renderRows();
      });
    });

    document.querySelectorAll("[data-window]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-window]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.window = btn.dataset.window;
        renderRows();
      });
    });

    document.querySelectorAll(".filter-chip[data-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = state.status === btn.dataset.status ? null : btn.dataset.status;
        state.status = next;
        document.querySelectorAll(".filter-chip[data-status]").forEach((b) => {
          b.classList.toggle("is-on", b.dataset.status === next);
        });
        renderRows();
      });
    });

    if (els.search) {
      els.search.addEventListener("input", () => {
        state.query = els.search.value;
        renderRows();
      });
    }

    els.rows.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (row) openDrawer(row.dataset.id);
    });

    els.cards.addEventListener("click", (e) => {
      const card = e.target.closest("[data-id]");
      if (card) openDrawer(card.dataset.id);
    });

    if (els.backdrop) els.backdrop.addEventListener("click", closeDrawer);
    if (els.menu) {
      els.menu.addEventListener("click", () => {
        els.sidebar.classList.add("is-open");
        els.scrim.classList.add("is-open");
      });
    }
    if (els.scrim) els.scrim.addEventListener("click", closeMobileNav);

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== els.search) {
        e.preventDefault();
        if (els.search) els.search.focus();
      }
      if (e.key === "Escape") {
        closeDrawer();
        closeMobileNav();
        if (els.search) els.search.blur();
      }
    });
  }

  function bootViewer() {
    const v = data.viewer;
    const av = document.getElementById("viewer-avatar");
    if (av) {
      av.textContent = v.initials;
      av.setAttribute("style", avatarStyle(v.id));
    }
    const name = document.getElementById("viewer-name");
    const role = document.getElementById("viewer-role");
    if (name) name.textContent = v.name;
    if (role) role.textContent = v.role;
    const clock = tzParts(now);
    const dateEl = document.getElementById("clock-date");
    const timeEl = document.getElementById("clock-time");
    if (dateEl) dateEl.textContent = `${clock.month}月${clock.day}日 ${clock.weekday}`;
    if (timeEl) timeEl.textContent = `${clock.hour}:${clock.minute}`;
  }

  bootViewer();
  renderStats();
  bind();
  renderRows();
})();
