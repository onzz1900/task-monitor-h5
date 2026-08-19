/* 任务流转中心 — 备选视觉方案交互逻辑 */
(function () {
  "use strict";

  var DATA = window.TCF_DATA;
  var NOW = new Date(DATA.now);

  var STATUS_META = {
    "运行中": { cls: "st-running", color: "var(--calm)", meta: "正在采集 / 监控" },
    "待流转": { cls: "st-waiting", color: "var(--warn)", meta: "等下一手接续" },
    "已阻塞": { cls: "st-blocked", color: "var(--hot)", meta: "需人工排除" },
    "本轮已完成": { cls: "st-done", color: "var(--ok)", meta: "已归档关闭" },
  };

  var RING_COLOR = {
    "运行中": "var(--calm)",
    "待流转": "var(--warn)",
    "已阻塞": "var(--hot)",
    "本轮已完成": "var(--ok)",
  };

  /* ---------- 时间工具（相对固定的演示时间基准） ----------
     所有展示时间统一按北京时间（UTC+8）格式化，
     与访问者所在时区无关，保证演示数据到处一致。 */

  var BJ_OFFSET = 8 * 60 * 60 * 1000;

  function toBJ(dateLike) {
    return new Date(new Date(dateLike).getTime() + BJ_OFFSET);
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function hm(d) {
    return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  }

  function dayLabel(d) {
    var one = 24 * 60 * 60 * 1000;
    var startOf = function (x) {
      return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
    };
    var diff = Math.round((startOf(d) - startOf(toBJ(NOW))) / one);
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    if (diff === -1) return "昨天";
    return d.getUTCMonth() + 1 + "月" + d.getUTCDate() + "日";
  }

  function whenLabel(iso) {
    if (!iso) return "已结束";
    var d = toBJ(iso);
    return dayLabel(d) + " " + hm(d);
  }

  function relLabel(iso, nextTo) {
    if (!iso) return "本轮已关闭";
    var mins = Math.round((new Date(iso) - NOW) / 60000);
    var rel;
    if (mins <= 0) rel = "已超时";
    else if (mins < 60) rel = mins + " 分钟后";
    else if (mins < 24 * 60) rel = Math.floor(mins / 60) + " 小时 " + (mins % 60) + " 分后";
    else rel = Math.floor(mins / (24 * 60)) + " 天后";
    return nextTo ? rel + " → " + nextTo : rel;
  }

  function isSoon(iso) {
    if (!iso) return false;
    var mins = (new Date(iso) - NOW) / 60000;
    return mins > 0 && mins <= 90;
  }

  /* ---------- 顶栏时钟与主题 ---------- */

  var weekCn = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  var nowBJ = toBJ(NOW);
  document.getElementById("clock").textContent =
    nowBJ.getUTCMonth() + 1 + "月" + nowBJ.getUTCDate() + "日 " + weekCn[nowBJ.getUTCDay()] + " " + hm(nowBJ);
  document.getElementById("foot-now").textContent =
    nowBJ.getUTCFullYear() + "-" + pad(nowBJ.getUTCMonth() + 1) + "-" + pad(nowBJ.getUTCDate()) + " " + hm(nowBJ) + "（北京时间）";
  document.getElementById("hero-kicker").textContent =
    DATA.company + " · " + DATA.boardTitleEn + " · 值班 " + DATA.viewer.name;

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-theme-set") === theme);
    });
    try {
      localStorage.setItem("tcf-theme", theme);
    } catch (err) {}
  }

  document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTheme(btn.getAttribute("data-theme-set"));
    });
  });

  applyTheme(document.documentElement.getAttribute("data-theme") || "light");

  /* ---------- 统计卡 ---------- */

  var ORDER = ["运行中", "待流转", "已阻塞", "本轮已完成"];

  function countBy(status) {
    return DATA.tasks.filter(function (t) {
      return t.status === status;
    }).length;
  }

  var statsEl = document.getElementById("stats");
  ORDER.forEach(function (status) {
    var meta = STATUS_META[status];
    var el = document.createElement("article");
    el.className = "stat";
    el.style.setProperty("--stat-color", meta.color);
    el.innerHTML =
      '<div class="stat-label"><span class="stat-dot"></span>' + status + "</div>" +
      '<div class="stat-value">' + countBy(status) + "</div>" +
      '<div class="stat-meta">' + meta.meta + "</div>";
    statsEl.appendChild(el);
  });

  /* ---------- 筛选 ---------- */

  var currentFilter = "all";
  var chipsEl = document.getElementById("chips");
  var filters = [{ key: "all", label: "全部" }].concat(
    ORDER.map(function (s) {
      return { key: s, label: s };
    })
  );

  filters.forEach(function (f) {
    var count = f.key === "all" ? DATA.tasks.length : countBy(f.key);
    var btn = document.createElement("button");
    btn.className = "chip" + (f.key === currentFilter ? " is-active" : "");
    btn.setAttribute("role", "tab");
    btn.innerHTML = f.label + '<span class="chip-n">' + count + "</span>";
    btn.addEventListener("click", function () {
      currentFilter = f.key;
      chipsEl.querySelectorAll(".chip").forEach(function (c) {
        c.classList.remove("is-active");
      });
      btn.classList.add("is-active");
      renderList();
    });
    chipsEl.appendChild(btn);
  });

  /* ---------- 任务票据列表 ---------- */

  var listEl = document.getElementById("ticket-list");
  var emptyEl = document.getElementById("empty");

  function ringHTML(task, extraClass) {
    var pct = Math.round((task.pointsDone / task.pointsTotal) * 100);
    return (
      '<div class="ring ' + (extraClass || "") + '" style="--pct:' + pct +
      ";--ring-color:" + RING_COLOR[task.status] + '" aria-label="点位进度 ' +
      task.pointsDone + "/" + task.pointsTotal + '">' +
      '<div class="ring-hole"><span class="ring-num">' + task.pointsDone + "/" + task.pointsTotal +
      '<span class="ring-cap">点位</span></span></div></div>'
    );
  }

  function sortedTasks() {
    return DATA.tasks.slice().sort(function (a, b) {
      if (!a.nextTransferAt) return 1;
      if (!b.nextTransferAt) return -1;
      return new Date(a.nextTransferAt) - new Date(b.nextTransferAt);
    });
  }

  function renderList() {
    var tasks = sortedTasks().filter(function (t) {
      return currentFilter === "all" || t.status === currentFilter;
    });

    listEl.innerHTML = "";
    emptyEl.hidden = tasks.length > 0;

    tasks.forEach(function (task) {
      var meta = STATUS_META[task.status];
      var el = document.createElement("button");
      el.type = "button";
      el.className =
        "ticket" +
        (task.status === "已阻塞" ? " is-blocked" : "") +
        (task.status === "本轮已完成" ? " is-done" : "");
      el.setAttribute("aria-label", task.title + " 详情");
      el.innerHTML =
        '<div class="ticket-main">' +
        ringHTML(task) +
        '<div class="ticket-info">' +
        '<div class="ticket-tags">' +
        '<span class="ticket-id">' + task.id + "</span>" +
        '<span class="tag tag-status ' + meta.cls + '">' + task.status + "</span>" +
        '<span class="tag tag-type">' + task.typeLabel + "</span>" +
        "</div>" +
        '<h3 class="ticket-title">' + task.title + "</h3>" +
        '<div class="ticket-sub">' + task.channel + " · " + task.owner.name + " · " + task.action + "</div>" +
        '<div class="ticket-run">' +
        '<span class="run-badge ' + (task.lastRunOk ? "run-ok" : "run-fail") + '">' +
        (task.lastRunOk ? "成功" : "失败") + "</span>" +
        '<span class="run-text">' + task.lastRunText.replace(/^(成功|失败)\s*·\s*/, "") + "</span>" +
        '<span class="run-at">上次运行 ' + whenLabel(task.lastRunAt) + "</span>" +
        "</div></div></div>" +
        '<div class="ticket-stub">' +
        '<span class="stub-kicker">下次流转</span>' +
        '<span class="stub-when">' + whenLabel(task.nextTransferAt) + "</span>" +
        '<span class="stub-rel' + (isSoon(task.nextTransferAt) ? " is-soon" : "") + '">' +
        relLabel(task.nextTransferAt, task.nextTo) + "</span>" +
        "</div>";
      el.addEventListener("click", function () {
        openSheet(task);
      });
      listEl.appendChild(el);
    });
  }

  renderList();

  /* ---------- 详情面板 ---------- */

  var sheet = document.getElementById("sheet");
  var backdrop = document.getElementById("sheet-backdrop");
  var lastFocus = null;

  function openSheet(task) {
    lastFocus = document.activeElement;
    var meta = STATUS_META[task.status];
    sheet.innerHTML =
      '<div class="sheet-top">' +
      '<span class="ticket-id">' + task.id + "</span>" +
      '<span class="tag tag-status ' + meta.cls + '">' + task.status + "</span>" +
      '<span class="tag tag-type">' + task.typeLabel + "</span>" +
      '<button type="button" class="sheet-close" id="sheet-close" aria-label="关闭详情">✕</button>' +
      "</div>" +
      '<h2 class="sheet-title" id="sheet-title">' + task.title + "</h2>" +
      '<div class="sheet-grid">' +
      '<div class="sheet-cell"><div class="cell-label">最近一次运行</div>' +
      '<div class="cell-value">' + whenLabel(task.lastRunAt) + "</div>" +
      '<div class="cell-sub">' + task.channel + "</div></div>" +
      '<div class="sheet-cell"><div class="cell-label">运行结果</div>' +
      '<div class="cell-value"><span class="run-badge ' + (task.lastRunOk ? "run-ok" : "run-fail") + '">' +
      (task.lastRunOk ? "成功" : "失败") + "</span></div>" +
      '<div class="cell-sub">' + task.lastRunText.replace(/^(成功|失败)\s*·\s*/, "") + "</div></div>" +
      '<div class="sheet-cell span2"><div class="cell-label">下次流转</div>' +
      '<div class="cell-value big">' + whenLabel(task.nextTransferAt) + "</div>" +
      '<div class="cell-sub">' + relLabel(task.nextTransferAt, task.nextTo) + "</div></div>" +
      '<div class="sheet-cell span2"><div class="cell-label">点位进度</div>' +
      '<div class="sheet-points">' + ringHTML(task) +
      '<p class="sheet-note">' + task.pointsNote + "</p></div></div>" +
      "</div>" +
      '<div class="sheet-owner">' +
      '<span class="avatar" style="background:hsl(' + task.owner.hue + ',45%,88%);color:hsl(' +
      task.owner.hue + ',55%,30%)">' + task.owner.initials + "</span>" +
      "<span>负责人 " + task.owner.name + " · " + task.owner.team + " — " + task.action + "</span>" +
      "</div>";

    sheet.hidden = false;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("sheet-close").addEventListener("click", closeSheet);
    document.getElementById("sheet-close").focus();
  }

  function closeSheet() {
    sheet.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) closeSheet();
  });
})();
