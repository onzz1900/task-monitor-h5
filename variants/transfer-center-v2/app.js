/* 任务流转中心 / Mission Transfer Center — 流转时刻轴交互 */

(function () {
  const KEY = "mtc-v2-theme";
  const buttons = document.querySelectorAll("[data-theme-set]");

  function apply(theme) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch (err) {}
    buttons.forEach((b) => {
      const on = b.dataset.themeSet === next;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.themeSet)));
  apply(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
})();

(function () {
  const data = window.TRANSFER_CENTER_V2;
  if (!data || !Array.isArray(data.tasks)) return;

  const TZ = data.timezone || "Asia/Shanghai";
  const now = new Date(data.now);
  const DONE = "本轮已完成";

  const els = {
    timeline: document.getElementById("timeline"),
    railNote: document.getElementById("rail-note"),
    search: document.getElementById("search"),
    pills: document.getElementById("pills"),
    sheet: document.getElementById("sheet"),
    backdrop: document.getElementById("backdrop"),
    snapshot: document.getElementById("snapshot"),
    footViewer: document.getElementById("foot-viewer"),
  };
  if (!els.timeline) return;

  const state = { filter: "all", query: "", open: null, lastFocus: null };

  /* ---------- helpers ---------- */

  function parts(d) {
    const fmt = new Intl.DateTimeFormat("zh-CN", {
      timeZone: TZ,
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const out = {};
    for (const p of fmt.formatToParts(d)) if (p.type !== "literal") out[p.type] = p.value;
    return out;
  }

  function dayKey(d) {
    const p = parts(d);
    return `${p.month}-${p.day}`;
  }

  function dayLabel(iso) {
    const d = new Date(iso);
    if (dayKey(d) === dayKey(now)) return "今天";
    if (dayKey(d) === dayKey(new Date(now.getTime() + 86400000))) return "明天";
    if (dayKey(d) === dayKey(new Date(now.getTime() - 86400000))) return "昨天";
    const p = parts(d);
    return `${p.month}月${p.day}日 ${p.weekday || ""}`.trim();
  }

  function clockLabel(iso) {
    const p = parts(new Date(iso));
    return `${p.hour}:${p.minute}`;
  }

  function minutesTo(iso) {
    return Math.round((new Date(iso) - now) / 60000);
  }

  function spanText(mins) {
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return `${d} 天 ${h % 24} 小时`;
    }
    return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
  }

  function tone(task) {
    if (task.status === DONE) return "done";
    const mins = minutesTo(task.nextTransferAt);
    if (mins < 0) return "over";
    if (mins <= 90) return "soon";
    return "wait";
  }

  function relText(task) {
    if (task.status === DONE) return "本轮已关闭";
    const mins = minutesTo(task.nextTransferAt);
    if (mins < 0) return `已超时 ${spanText(mins)}`;
    if (mins === 0) return "就在此刻";
    return `${spanText(mins)}后`;
  }

  function person(id) {
    return data.people[id] || { name: "—", role: "", initials: "·", hue: 220 };
  }

  function avatar(id) {
    const p = person(id);
    const bg = `hsl(${p.hue} 46% 88%)`;
    const fg = `hsl(${p.hue} 45% 26%)`;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return `<span class="avatar" style="background:${dark ? `hsl(${p.hue} 28% 24%)` : bg};color:${
      dark ? `hsl(${p.hue} 60% 78%)` : fg
    }">${p.initials}</span>`;
  }

  function typeLabel(t) {
    return (data.types && data.types[t]) || "任务";
  }

  function pct(task) {
    return task.pointsTotal ? Math.round((task.pointsDone / task.pointsTotal) * 100) : 0;
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------- point markers ---------- */

  function dotsHtml(task) {
    if (task.pointsTotal > 24) {
      return `<div class="dots"><span class="on" style="width:${pct(task) * 1.6}px"></span></div>`;
    }
    let html = "";
    for (let i = 0; i < task.pointsTotal; i++) {
      html += `<span class="${i < task.pointsDone ? "on" : ""}"></span>`;
    }
    return `<div class="dots" aria-hidden="true">${html}</div>`;
  }

  function pointsBlock(task) {
    return `
      <div class="points">
        <div class="points-head">
          <span class="points-num">${task.pointsDone}/${task.pointsTotal}</span>
          <span class="points-word">点位已完成</span>
          <span class="points-pct">${pct(task)}%</span>
        </div>
        ${dotsHtml(task)}
      </div>
    `;
  }

  function runHtml(task) {
    return `
      <span class="run ${task.lastRunOk ? "ok" : "fail"}">
        <b>${esc(task.lastRunText)}</b>
        <span>${dayLabel(task.lastRunAt)} ${clockLabel(task.lastRunAt)}</span>
      </span>
    `;
  }

  /* ---------- filtering ---------- */

  function matches(task) {
    if (state.filter !== "all" && task.status !== state.filter) return false;
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      task.id,
      task.title,
      task.channel,
      task.action,
      task.lastRunText,
      task.status,
      typeLabel(task.type),
      person(task.owner).name,
      person(task.nextTransferTo).name,
      (task.pointGroups || []).map((g) => g.name).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function ordered(list) {
    return list.slice().sort((a, b) => {
      const ad = a.status === DONE;
      const bd = b.status === DONE;
      if (ad !== bd) return ad ? 1 : -1;
      return new Date(a.nextTransferAt) - new Date(b.nextTransferAt);
    });
  }

  /* ---------- top of page ---------- */

  function renderChrome() {
    const p = parts(now);
    if (els.snapshot) els.snapshot.textContent = `${p.month}月${p.day}日 ${p.weekday || ""} ${p.hour}:${p.minute}`;
    if (els.footViewer) {
      const v = data.viewer || {};
      els.footViewer.textContent = `${data.company || ""} · 当前值班 ${v.name || "—"}`;
    }
  }

  function renderStats() {
    const total = data.tasks.length || 1;
    const count = (status) => data.tasks.filter((t) => t.status === status).length;
    const map = { running: "运行中", waiting: "待流转", blocked: "已阻塞", done: DONE };
    Object.keys(map).forEach((key) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (!el) return;
      const n = count(map[key]);
      el.textContent = String(n);
      const ring = el.closest(".ring");
      if (ring) ring.style.setProperty("--pct", String(Math.round((n / total) * 100)));
    });
  }

  function renderNextUp() {
    const live = data.tasks.filter((t) => t.status !== DONE);
    const overdue = live.filter((t) => minutesTo(t.nextTransferAt) < 0).sort((a, b) => new Date(a.nextTransferAt) - new Date(b.nextTransferAt));
    const upcoming = live
      .filter((t) => minutesTo(t.nextTransferAt) >= 0)
      .sort((a, b) => new Date(a.nextTransferAt) - new Date(b.nextTransferAt));
    const task = overdue[0] || upcoming[0] || data.tasks[0];
    const host = document.getElementById("next-up");
    if (!task || !host) return;

    const t = tone(task);
    host.dataset.tone = t;
    host.querySelector(".next-up-k").textContent = t === "over" ? "已超时未流转" : "最近一次流转";
    document.getElementById("next-clock").textContent = `${dayLabel(task.nextTransferAt)} ${clockLabel(task.nextTransferAt)}`;
    document.getElementById("next-rel").textContent = relText(task);
    document.getElementById("next-task").textContent = `${task.title}`;
    document.getElementById("next-hand").textContent = `${task.id} · ${person(task.owner).name} → ${
      person(task.nextTransferTo).name
    }（${person(task.nextTransferTo).role}） · ${task.pointsDone}/${task.pointsTotal} 点位`;
  }

  /* ---------- timeline ---------- */

  function renderTimeline() {
    const list = ordered(data.tasks.filter(matches));
    if (els.railNote) {
      els.railNote.textContent = list.length
        ? `按下次流转时间排序 · 共 ${list.length} 个任务`
        : "没有匹配的任务";
    }

    if (!list.length) {
      els.timeline.innerHTML = `<li class="empty">没有匹配的任务，换个状态或清空搜索词试试。</li>`;
      return;
    }

    let lastDay = "";
    els.timeline.innerHTML = list
      .map((task) => {
        const t = tone(task);
        const day = task.status === DONE ? "已结束" : dayLabel(task.nextTransferAt);
        const sep = day === lastDay ? "" : `<li class="day-sep"><span>${day}</span></li>`;
        lastDay = day;
        const owner = person(task.owner);
        const next = person(task.nextTransferTo);
        const when = task.status === DONE ? "—" : clockLabel(task.nextTransferAt);
        return `
          ${sep}
          <li class="entry" data-tone="${t}">
            <div class="entry-time">
              <div class="entry-clock">${when}</div>
              <div class="entry-rel">${relText(task)}</div>
            </div>
            <div class="entry-axis" aria-hidden="true"><i></i></div>
            <button class="card${state.open === task.id ? " is-open" : ""}" type="button" data-id="${task.id}"
              data-tone="${t}" data-blocked="${task.status === "已阻塞" ? 1 : 0}"
              aria-label="${esc(task.title)} 详情">
              <div class="card-top">
                <span class="tag tag-status" data-s="${task.status}">${task.status}</span>
                <span class="tag">${typeLabel(task.type)}</span>
                <span class="tag tag-id">${task.id}</span>
              </div>
              <div class="card-title">${esc(task.title)}</div>
              <div class="card-channel">${esc(task.channel)} · ${esc(task.action)}</div>
              <div class="card-when">
                <span class="points-word">下次流转</span>
                <b>${day} ${when}</b>
                <em>${relText(task)} → ${next.name}</em>
              </div>
              ${pointsBlock(task)}
              <div class="card-foot">
                ${runHtml(task)}
                <span class="who">${avatar(task.owner)}${owner.name}<span class="chev">›</span></span>
              </div>
            </button>
          </li>
        `;
      })
      .join("");
  }

  /* ---------- detail sheet ---------- */

  function groupsHtml(task) {
    const groups = task.pointGroups || [];
    if (!groups.length) return "";
    return `
      <ul class="groups">
        ${groups
          .map((g) => {
            const p = g.total ? Math.round((g.done / g.total) * 100) : 0;
            return `
              <li data-full="${g.done === g.total ? 1 : 0}">
                <span class="g-name">${esc(g.name)}</span>
                <span class="g-num">${g.done}/${g.total}</span>
                <span class="g-bar"><i style="width:${p}%"></i></span>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function openSheet(id) {
    const task = data.tasks.find((t) => t.id === id);
    if (!task || !els.sheet) return;
    state.open = id;
    state.lastFocus = document.activeElement;
    const t = tone(task);
    const owner = person(task.owner);
    const next = person(task.nextTransferTo);
    const when = task.status === DONE ? "已结束" : `${dayLabel(task.nextTransferAt)} ${clockLabel(task.nextTransferAt)}`;

    els.sheet.innerHTML = `
      <div class="sheet-head">
        <span class="tag tag-status" data-s="${task.status}">${task.status}</span>
        <span class="tag tag-id">${task.id}</span>
        <button class="sheet-close" id="sheet-close" type="button" aria-label="关闭详情">✕</button>
      </div>
      <div class="sheet-body">
        <h3 class="sheet-title">${esc(task.title)}</h3>
        <div class="sheet-channel">${esc(task.channel)} · ${typeLabel(task.type)}</div>

        <div class="sheet-hero" data-tone="${t}">
          <div class="sheet-hero-k">下次流转时间</div>
          <div class="sheet-hero-v">${when}</div>
          <div class="sheet-hero-r">${relText(task)} · 交给 ${next.name}（${next.role}）</div>
        </div>

        <div class="kv">
          <div>
            <div class="kv-k">点位进度</div>
            <div class="kv-v num">${task.pointsDone}/${task.pointsTotal}</div>
          </div>
          <div>
            <div class="kv-k">最近运行时间</div>
            <div class="kv-v num">${dayLabel(task.lastRunAt)} ${clockLabel(task.lastRunAt)}</div>
          </div>
          <div class="span">
            <div class="kv-k">上次运行结果</div>
            <div class="kv-v">${runHtml(task)}</div>
          </div>
          <div>
            <div class="kv-k">负责人</div>
            <div class="kv-v">${avatar(task.owner)} ${owner.name} · ${owner.role}</div>
          </div>
          <div>
            <div class="kv-k">当前动作</div>
            <div class="kv-v">${esc(task.action)}</div>
          </div>
        </div>

        <div class="kv-k" style="margin-top:20px">点位分布</div>
        ${groupsHtml(task)}
        <p class="note">${esc(task.pointsNote)}</p>
      </div>
    `;

    els.sheet.classList.add("is-open");
    els.sheet.setAttribute("aria-hidden", "false");
    els.backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    const close = document.getElementById("sheet-close");
    if (close) {
      close.addEventListener("click", closeSheet);
      close.focus();
    }
    renderTimeline();
  }

  function closeSheet() {
    if (!state.open) return;
    state.open = null;
    els.sheet.classList.remove("is-open");
    els.sheet.setAttribute("aria-hidden", "true");
    els.backdrop.hidden = true;
    document.body.style.overflow = "";
    renderTimeline();
    if (state.lastFocus && document.body.contains(state.lastFocus)) state.lastFocus.focus();
  }

  /* ---------- events ---------- */

  els.timeline.addEventListener("click", (e) => {
    const card = e.target.closest(".card[data-id]");
    if (card) openSheet(card.dataset.id);
  });

  if (els.pills) {
    els.pills.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      state.filter = btn.dataset.filter;
      els.pills.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === btn));
      renderTimeline();
    });
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      state.query = els.search.value;
      renderTimeline();
    });
  }

  if (els.backdrop) els.backdrop.addEventListener("click", closeSheet);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });

  document.querySelectorAll("[data-theme-set]").forEach((b) =>
    b.addEventListener("click", () => {
      renderTimeline();
      if (state.open) openSheet(state.open);
    })
  );

  renderChrome();
  renderStats();
  renderNextUp();
  renderTimeline();
})();
