/* 任务登记中心 — 登记 / 编辑 / 查看任务。
   数据 = 种子（registry-data.js）+ localStorage 覆盖，无后端。
   调度为工程化实现：5 字段 cron 或固定间隔，统一按 Asia/Shanghai 推导下次流转。 */
(function () {
  "use strict";

  var META = window.TCF_REGISTRY_META;
  var SEED = window.TCF_REGISTRY_SEED;
  var STORE_KEY = "tcf-registry-v1";
  var H8 = 8 * 3600e3; // Asia/Shanghai = UTC+8（无夏令时）

  /* ================= cron 解析与下次运行计算 ================= */

  // 解析单个字段（支持 * , a a-b */n a-b/n 组合），返回允许值 Set；"*" 返回 null（任意）
  function parseField(field, lo, hi, isDow) {
    if (field === "*") return null;
    var set = new Set();
    var parts = field.split(",");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      var step = 1;
      var stepMatch = part.match(/^(.+)\/(\d+)$/);
      if (stepMatch) {
        part = stepMatch[1];
        step = parseInt(stepMatch[2], 10);
        if (!step || step < 1) throw new Error("步长无效");
      }
      var a, b;
      if (part === "*") {
        a = lo; b = hi;
      } else if (/^\d+$/.test(part)) {
        a = b = parseInt(part, 10);
        if (stepMatch) b = hi; // "5/2" 视为 5-max/2
      } else {
        var range = part.match(/^(\d+)-(\d+)$/);
        if (!range) throw new Error("字段格式无效");
        a = parseInt(range[1], 10);
        b = parseInt(range[2], 10);
      }
      if (isDow) { if (a === 7) a = 0; if (b === 7) b = 7; } // 周日可写 0 或 7
      if (a < lo || (b > hi && !(isDow && b === 7)) || a > b) throw new Error("数值超出范围");
      for (var v = a; v <= b; v += step) set.add(isDow ? v % 7 : v);
    }
    return set;
  }

  // 返回 {min,hour,dom,mon,dow}（Set 或 null）；表达式非法时抛错
  function parseCron(expr) {
    var fields = String(expr || "").trim().split(/\s+/);
    if (fields.length !== 5) throw new Error("需要 5 个字段：分 时 日 月 周");
    return {
      min: parseField(fields[0], 0, 59, false),
      hour: parseField(fields[1], 0, 23, false),
      dom: parseField(fields[2], 1, 31, false),
      mon: parseField(fields[3], 1, 12, false),
      dow: parseField(fields[4], 0, 6, true),
    };
  }

  function allow(set, v) {
    return set === null || set.has(v);
  }

  // 标准 cron 语义：日 与 周 都受限时取「或」
  function dayMatches(spec, dom, dow) {
    if (spec.dom === null && spec.dow === null) return true;
    if (spec.dom !== null && spec.dow === null) return spec.dom.has(dom);
    if (spec.dom === null && spec.dow !== null) return spec.dow.has(dow);
    return spec.dom.has(dom) || spec.dow.has(dow);
  }

  // 从 from（真实时刻）起算的下一次 cron 触发，返回真实 Date；一年内无触发返回 null
  function nextCronRun(expr, from) {
    var spec = parseCron(expr);
    // 转成北京墙上时间处理（用 getUTC* 读取），对齐到下一整分
    var t = new Date(Math.floor((from.getTime() + H8) / 60000) * 60000 + 60000);
    var guard = 0;
    while (guard < 527040) { // 366 天
      var mon = t.getUTCMonth() + 1;
      if (!allow(spec.mon, mon) || !dayMatches(spec, t.getUTCDate(), t.getUTCDay())) {
        t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1));
        guard += 1440;
        continue;
      }
      if (!allow(spec.hour, t.getUTCHours())) {
        t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCHours() + 1));
        guard += 60;
        continue;
      }
      if (!allow(spec.min, t.getUTCMinutes())) {
        t = new Date(t.getTime() + 60000);
        guard += 1;
        continue;
      }
      return new Date(t.getTime() - H8);
    }
    return null;
  }

  // 固定间隔：以 updatedAt 为锚点，返回 > now 的最近一格
  function nextIntervalRun(anchorIso, intervalMinutes, from) {
    var anchor = new Date(anchorIso).getTime();
    var step = intervalMinutes * 60000;
    if (from.getTime() < anchor) return new Date(anchor + step);
    var k = Math.ceil((from.getTime() - anchor + 1000) / step);
    return new Date(anchor + k * step);
  }

  function computeNextRun(task, from) {
    from = from || new Date();
    try {
      if (task.schedule.kind === "cron") return nextCronRun(task.schedule.cron, from);
      return nextIntervalRun(task.updatedAt, task.schedule.intervalMinutes, from);
    } catch (err) {
      return null;
    }
  }

  /* ================= 存储 ================= */

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {}
    return SEED.map(function (t) {
      return JSON.parse(JSON.stringify(t));
    });
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
    } catch (err) {}
  }

  function nextId(tasks) {
    var max = 1000;
    tasks.forEach(function (t) {
      var n = parseInt(String(t.id).replace(/^REG-/, ""), 10);
      if (n > max) max = n;
    });
    return "REG-" + (max + 1);
  }

  /* ================= 展示工具 ================= */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  // 北京时间展示
  function fmtBJ(date) {
    if (!date) return "—";
    var d = date instanceof Date ? date : new Date(date);
    var w = new Date(d.getTime() + H8);
    return (
      w.getUTCMonth() + 1 + "月" + w.getUTCDate() + "日 " + pad(w.getUTCHours()) + ":" + pad(w.getUTCMinutes())
    );
  }

  function fmtRel(date) {
    if (!date) return "";
    var mins = Math.round((date.getTime() - Date.now()) / 60000);
    if (mins <= 0) return "现在";
    if (mins < 60) return mins + " 分钟后";
    if (mins < 1440) return Math.floor(mins / 60) + " 小时 " + (mins % 60) + " 分后";
    return Math.floor(mins / 1440) + " 天后";
  }

  function scheduleSummary(task) {
    return task.schedule.kind === "cron"
      ? "cron " + task.schedule.cron
      : "每 " + task.schedule.intervalMinutes + " 分钟";
  }

  /* ================= 状态 ================= */

  var tasks = loadTasks();
  var listEl = document.getElementById("reg-list");
  var countEl = document.getElementById("reg-count");
  var sheet = document.getElementById("sheet");
  var backdrop = document.getElementById("sheet-backdrop");

  /* ================= 列表渲染 ================= */

  function renderList() {
    countEl.textContent = tasks.length + " 个任务";
    listEl.innerHTML = "";
    tasks
      .slice()
      .sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      })
      .forEach(function (task) {
        var next = computeNextRun(task);
        var el = document.createElement("article");
        el.className = "ticket reg-ticket";
        el.innerHTML =
          '<div class="ticket-main">' +
          '<div class="ticket-info">' +
          '<div class="ticket-tags">' +
          '<span class="ticket-id">' + esc(task.id) + "</span>" +
          '<span class="tag tag-type">' + esc(META.types[task.type] || task.type) + "</span>" +
          (task.callback
            ? '<span class="tag reg-cb-on">回调 ✓</span>'
            : '<span class="tag reg-cb-off">无回调</span>') +
          "</div>" +
          '<h3 class="ticket-title">' + esc(task.name) + "</h3>" +
          '<div class="ticket-sub">' +
          esc([task.owner, task.points.total + " 个点位", task.description].filter(Boolean).join(" · ")) +
          "</div>" +
          '<div class="reg-meta">' +
          '<span>调度 <b class="mono">' + esc(scheduleSummary(task)) + "</b>（北京时间）</span>" +
          "<span>备份最近 <b>" + esc(task.backup.keepRuns) + "</b> 次</span>" +
          (task.callback
            ? "<span>回调 <b class='mono'>" + esc(task.callback.url) + "</b> · 超时 " +
              esc(task.callback.timeoutMs) + "ms · 重试 " + esc(task.callback.retries) + " 次" +
              (task.callback.secretRef ? " · 密钥引用 <b class='mono'>" + esc(task.callback.secretRef) + "</b>" : "") +
              "</span>"
            : "") +
          "<span>更新于 " + esc(fmtBJ(task.updatedAt)) + "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          '<div class="ticket-stub">' +
          '<span class="stub-kicker">下次流转</span>' +
          '<span class="stub-when">' + esc(fmtBJ(next)) + "</span>" +
          '<span class="stub-rel">' + esc(fmtRel(next)) + "</span>" +
          '<button type="button" class="reg-edit" data-id="' + esc(task.id) + '">编辑</button>' +
          "</div>";
        listEl.appendChild(el);
      });

    listEl.querySelectorAll(".reg-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var task = tasks.find(function (t) {
          return t.id === btn.getAttribute("data-id");
        });
        if (task) openForm(task);
      });
    });
  }

  /* ================= 表单 ================= */

  function fieldRow(label, inner, hint) {
    return (
      '<label class="f-row">' +
      '<span class="f-label">' + label + "</span>" +
      inner +
      (hint ? '<span class="f-hint">' + hint + "</span>" : "") +
      "</label>"
    );
  }

  function openForm(task) {
    var isEdit = Boolean(task);
    var d = META.defaults;
    var v = task || {
      name: "",
      description: "",
      owner: "",
      type: "collect",
      points: { total: 10, note: "" },
      schedule: { kind: "cron", cron: "0 9 * * *", intervalMinutes: 60, timezone: "Asia/Shanghai" },
      callback: null,
      backup: { keepRuns: d.keepRuns },
    };
    var cb = v.callback || { url: "", timeoutMs: d.timeoutMs, retries: d.retries, secretRef: "" };

    sheet.innerHTML =
      '<div class="sheet-top">' +
      '<span class="ticket-id">' + (isEdit ? esc(task.id) : "新登记") + "</span>" +
      '<button type="button" class="sheet-close" id="sheet-close" aria-label="关闭">✕</button>' +
      "</div>" +
      '<h2 class="sheet-title">' + (isEdit ? "编辑任务" : "登记任务") + "</h2>" +
      '<form id="reg-form" class="reg-form" novalidate>' +

      '<fieldset class="f-group"><legend>基础信息</legend>' +
      fieldRow("任务名称 *", '<input class="f-input" name="name" required maxlength="64" value="' + esc(v.name) + '" />') +
      '<div class="f-cols">' +
      fieldRow("负责人", '<input class="f-input" name="owner" maxlength="32" value="' + esc(v.owner) + '" />') +
      fieldRow(
        "类型",
        '<select class="f-input" name="type">' +
          Object.keys(META.types)
            .map(function (k) {
              return '<option value="' + k + '"' + (v.type === k ? " selected" : "") + ">" + META.types[k] + "</option>";
            })
            .join("") +
          "</select>"
      ) +
      "</div>" +
      fieldRow("描述", '<textarea class="f-input" name="description" rows="2" maxlength="200">' + esc(v.description) + "</textarea>") +
      '<div class="f-cols">' +
      fieldRow("点位数量 *", '<input class="f-input" name="pointsTotal" type="number" min="1" max="999" required value="' + esc(v.points.total) + '" />') +
      fieldRow("点位说明", '<input class="f-input" name="pointsNote" maxlength="100" value="' + esc(v.points.note) + '" />') +
      "</div>" +
      "</fieldset>" +

      '<fieldset class="f-group"><legend>调度（Asia/Shanghai）</legend>' +
      '<div class="f-cols">' +
      fieldRow(
        "调度方式",
        '<select class="f-input" name="scheduleKind">' +
          '<option value="cron"' + (v.schedule.kind === "cron" ? " selected" : "") + ">cron 表达式</option>" +
          '<option value="interval"' + (v.schedule.kind === "interval" ? " selected" : "") + ">固定间隔</option>" +
          "</select>"
      ) +
      '<span data-when="cron">' +
      fieldRow("cron 表达式 *", '<input class="f-input mono" name="cron" value="' + esc(v.schedule.cron || "0 9 * * *") + '" />', "分 时 日 月 周") +
      "</span>" +
      '<span data-when="interval" hidden>' +
      fieldRow("间隔（分钟）*", '<input class="f-input" name="intervalMinutes" type="number" min="1" max="10080" value="' + esc(v.schedule.intervalMinutes || 60) + '" />') +
      "</span>" +
      "</div>" +
      '<p class="f-preview" id="cron-preview"></p>' +
      "</fieldset>" +

      '<fieldset class="f-group"><legend>回调（可选）' +
      '<label class="f-switch"><input type="checkbox" name="callbackEnabled"' + (v.callback ? " checked" : "") + " /> 启用</label>" +
      "</legend>" +
      '<div id="cb-fields"' + (v.callback ? "" : " hidden") + ">" +
      fieldRow("POST 回调地址 *", '<input class="f-input mono" name="cbUrl" type="url" placeholder="https://hooks.example.com/…" value="' + esc(cb.url) + '" />') +
      '<div class="f-cols">' +
      fieldRow("超时（毫秒）", '<input class="f-input" name="cbTimeout" type="number" min="1000" max="120000" value="' + esc(cb.timeoutMs) + '" />', "默认 10000") +
      fieldRow("失败重试次数", '<input class="f-input" name="cbRetries" type="number" min="0" max="10" value="' + esc(cb.retries) + '" />', "默认 3") +
      "</div>" +
      fieldRow(
        "签名密钥（secretRef）",
        '<select class="f-input" name="cbSecretRef">' +
          '<option value="">不使用</option>' +
          META.secretRefs
            .map(function (s) {
              return '<option value="' + esc(s.ref) + '"' + (cb.secretRef === s.ref ? " selected" : "") + ">" + esc(s.ref) + " — " + esc(s.description) + "</option>";
            })
            .join("") +
          "</select>",
        "只保存引用名，密钥本体由服务端密管持有，不进前端"
      ) +
      "</div>" +
      "</fieldset>" +

      '<fieldset class="f-group"><legend>备份</legend>' +
      fieldRow("保留最近 N 次运行结果", '<input class="f-input" name="keepRuns" type="number" min="1" max="100" value="' + esc(v.backup.keepRuns) + '" />', "默认 10") +
      "</fieldset>" +

      '<p class="f-error" id="form-error" hidden></p>' +
      '<div class="f-actions">' +
      '<button type="submit" class="btn-primary">' + (isEdit ? "保存修改" : "登记任务") + "</button>" +
      '<button type="button" class="btn-plain" id="form-cancel">取消</button>' +
      "</div>" +
      "</form>";

    sheet.hidden = false;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";

    var form = document.getElementById("reg-form");
    var kindSel = form.elements.scheduleKind;
    var preview = document.getElementById("cron-preview");
    var errorEl = document.getElementById("form-error");

    function syncKind() {
      var kind = kindSel.value;
      sheet.querySelectorAll("[data-when]").forEach(function (el) {
        el.hidden = el.getAttribute("data-when") !== kind;
      });
      updatePreview();
    }

    // 实时预览下一次触发，证明表达式已被真正解析
    function updatePreview() {
      var next = null;
      var bad = false;
      if (kindSel.value === "cron") {
        try {
          next = nextCronRun(form.elements.cron.value, new Date());
        } catch (err) {
          bad = true;
        }
      } else {
        var m = parseInt(form.elements.intervalMinutes.value, 10);
        if (m >= 1) next = new Date(Date.now() + m * 60000);
        else bad = true;
      }
      preview.textContent = bad
        ? "表达式无效，无法推导下次流转"
        : next
          ? "下次流转：" + fmtBJ(next) + "（北京时间，" + fmtRel(next) + "）"
          : "一年内无触发时刻";
      preview.classList.toggle("is-bad", bad);
    }

    kindSel.addEventListener("change", syncKind);
    form.elements.cron.addEventListener("input", updatePreview);
    form.elements.intervalMinutes.addEventListener("input", updatePreview);
    form.elements.callbackEnabled.addEventListener("change", function () {
      document.getElementById("cb-fields").hidden = !form.elements.callbackEnabled.checked;
    });
    syncKind();

    function fail(msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      var f = form.elements;
      var name = f.name.value.trim();
      if (!name) return fail("请填写任务名称");
      var pointsTotal = parseInt(f.pointsTotal.value, 10);
      if (!(pointsTotal >= 1)) return fail("点位数量至少为 1");

      var kind = f.scheduleKind.value;
      var cron = null;
      var intervalMinutes = null;
      if (kind === "cron") {
        cron = f.cron.value.trim();
        try {
          parseCron(cron);
        } catch (err) {
          return fail("cron 表达式无效：" + err.message);
        }
      } else {
        intervalMinutes = parseInt(f.intervalMinutes.value, 10);
        if (!(intervalMinutes >= 1)) return fail("请填写间隔分钟数");
      }

      var callback = null;
      if (f.callbackEnabled.checked) {
        var url = f.cbUrl.value.trim();
        if (!/^https?:\/\/.+/.test(url)) return fail("回调地址必须是 http(s) URL");
        var timeoutMs = parseInt(f.cbTimeout.value, 10);
        if (!(timeoutMs >= 1000 && timeoutMs <= 120000)) return fail("回调超时需在 1000–120000 毫秒之间");
        var retries = parseInt(f.cbRetries.value, 10);
        if (!(retries >= 0 && retries <= 10)) return fail("重试次数需在 0–10 之间");
        callback = { url: url, timeoutMs: timeoutMs, retries: retries, secretRef: f.cbSecretRef.value || null };
      }

      var keepRuns = parseInt(f.keepRuns.value, 10);
      if (!(keepRuns >= 1 && keepRuns <= 100)) return fail("备份份数需在 1–100 之间");

      var now = new Date().toISOString();
      var record = {
        id: isEdit ? task.id : nextId(tasks),
        name: name,
        description: f.description.value.trim(),
        owner: f.owner.value.trim(),
        type: f.type.value,
        points: { total: pointsTotal, note: f.pointsNote.value.trim() },
        schedule: { kind: kind, cron: cron, intervalMinutes: intervalMinutes, timezone: "Asia/Shanghai" },
        callback: callback,
        backup: { keepRuns: keepRuns },
        createdAt: isEdit ? task.createdAt : now,
        updatedAt: now,
      };

      if (isEdit) {
        tasks = tasks.map(function (t) {
          return t.id === task.id ? record : t;
        });
      } else {
        tasks.push(record);
      }
      saveTasks(tasks);
      closeForm();
      renderList();
    });

    document.getElementById("sheet-close").addEventListener("click", closeForm);
    document.getElementById("form-cancel").addEventListener("click", closeForm);
    form.elements.name.focus();
  }

  function closeForm() {
    sheet.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
  }

  backdrop.addEventListener("click", closeForm);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) closeForm();
  });

  /* ================= 主题 / 顶栏 / 入口 ================= */

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

  document.getElementById("reg-new").addEventListener("click", function () {
    openForm(null);
  });
  document.getElementById("reg-reset").addEventListener("click", function () {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (err) {}
    tasks = loadTasks();
    renderList();
  });

  renderList();
})();
