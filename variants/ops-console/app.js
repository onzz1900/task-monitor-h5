(function () {
  const data = window.DISPATCH;
  const now = new Date(data.now);

  const TYPE_LABEL = {
    review: "Review",
    seal: "Seal",
    audit: "Store audit",
    launch: "Launch",
    aftersales: "After-sales",
    weekly: "Weekly action",
    recon: "Recon",
  };

  const STATUS_LABEL = {
    pending: "Pending",
    "in-review": "In review",
    transferring: "Transferring",
    waiting: "Waiting",
    blocked: "Blocked",
    done: "Done",
  };

  const AVATAR_HUE = {
    fang: 230,
    chen: 265,
    lin: 160,
    zhao: 38,
    su: 200,
    zhou: 320,
    han: 190,
    shen: 145,
    wu: 20,
    pei: 280,
    rong: 48,
  };

  const state = {
    view: "due-now",
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

  function person(id) {
    return data.people[id];
  }

  function meeting(id) {
    return data.meetings.find((m) => m.id === id);
  }

  function avatarStyle(id) {
    const hue = AVATAR_HUE[id] ?? 220;
    return `background:hsla(${hue},55%,18%,1);color:hsla(${hue},80%,78%,1)`;
  }

  function avatarHtml(id) {
    const p = person(id);
    return `<span class="avatar" style="${avatarStyle(id)}" title="${p.name} · ${p.role}">${p.initials}</span>`;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmtClock(d) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      date: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())} ${data.timezone}`,
    };
  }

  function fmtStamp(iso) {
    const d = new Date(iso);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const day = sameDay ? "Today" : days[d.getDay()];
    return `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function minutesUntil(iso) {
    return Math.round((new Date(iso) - now) / 60000);
  }

  function transferTone(task) {
    if (task.status === "done") return "done";
    const mins = minutesUntil(task.nextTransferAt);
    if (mins < 0) return "over";
    if (mins <= 120) return "now";
    return "later";
  }

  function relativeTransfer(task) {
    if (task.status === "done") return "closed";
    const mins = minutesUntil(task.nextTransferAt);
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const clock = h > 0 ? `${h}h ${m}m` : `${m}m`;
    if (mins < 0) return `Overdue ${clock}`;
    if (mins === 0) return "Now";
    return `In ${clock}`;
  }

  function isOpen(task) {
    return task.status !== "done";
  }

  function isDueNow(task) {
    if (!isOpen(task)) return false;
    const mins = minutesUntil(task.nextTransferAt);
    return mins <= 120;
  }

  function matchesView(task) {
    const view = state.view;
    if (view === "due-now") return isDueNow(task);
    if (view === "open") return isOpen(task);
    if (view === "blocked") return task.status === "blocked";
    if (view === "done") return task.status === "done";
    if (view.startsWith("type:")) return task.type === view.slice(5);
    return true;
  }

  function matchesWindow(task) {
    if (state.window === "all") return true;
    const tone = transferTone(task);
    if (state.window === "overdue") return tone === "over" && isOpen(task);
    if (state.window === "today") {
      const d = new Date(task.nextTransferAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
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
      STATUS_LABEL[task.status],
      owner.name,
      owner.role,
      meet.title,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function visibleTasks() {
    return data.tasks
      .filter((t) => matchesView(t) && matchesWindow(t) && (!state.status || t.status === state.status) && matchesQuery(t))
      .sort((a, b) => new Date(a.nextTransferAt) - new Date(b.nextTransferAt));
  }

  function renderStats() {
    const todayMeetings = data.meetings.filter((m) => m.window === "today");
    const pending = data.tasks.filter(isOpen);
    const done = data.tasks.filter((t) => t.status === "done");
    const soon = data.tasks.filter((t) => isOpen(t) && minutesUntil(t.nextTransferAt) >= 0 && minutesUntil(t.nextTransferAt) <= 120);
    const over = data.tasks.filter((t) => isOpen(t) && minutesUntil(t.nextTransferAt) < 0);

    document.getElementById("stat-today").textContent = String(todayMeetings.length);
    document.getElementById("stat-today-meta").textContent = todayMeetings
      .map((m) => fmtStamp(m.when).replace("Today ", ""))
      .join(" · ");
    document.getElementById("stat-week").textContent = String(data.meetings.length);
    document.getElementById("stat-pending").textContent = String(pending.length);
    document.getElementById("stat-done").textContent = String(done.length);
    document.getElementById("stat-soon").textContent = String(soon.length);
    document.getElementById("stat-over").textContent = String(over.length);

    document.querySelector('[data-count="due-now"]').textContent = String(
      data.tasks.filter(isDueNow).length
    );
    document.querySelector('[data-count="open"]').textContent = String(pending.length);
    document.querySelector('[data-count="blocked"]').textContent = String(
      data.tasks.filter((t) => t.status === "blocked").length
    );
    document.querySelector('[data-count="done"]').textContent = String(done.length);
  }

  function transferCell(task) {
    const tone = transferTone(task);
    const next = person(task.nextTransferTo);
    return `
      <div class="xfer is-${tone}">
        <div class="xfer-when">${fmtStamp(task.nextTransferAt)}</div>
        <div class="xfer-rel">${relativeTransfer(task)} → ${next.name}</div>
      </div>
    `;
  }

  function renderRows() {
    const tasks = visibleTasks();
    els.result.textContent = `${tasks.length} row${tasks.length === 1 ? "" : "s"}`;

    if (!tasks.length) {
      els.rows.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="empty"><b>No matching work</b>Clear search or switch queue.</div></td></tr>`;
      els.cards.innerHTML = `<div class="empty"><b>No matching work</b>Clear search or switch queue.</div>`;
      return;
    }

    els.rows.innerHTML = tasks
      .map((task) => {
        const owner = person(task.owner);
        const meet = meeting(task.meeting);
        const selected = state.selected === task.id ? " is-selected" : "";
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
              <span class="chip status-${task.status}">${STATUS_LABEL[task.status]}</span>
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
              <div class="meet-name">${meet.title}</div>
              <div class="meet-time">${fmtStamp(meet.when)} · ${meet.room}</div>
            </td>
          </tr>
        `;
      })
      .join("");

    els.cards.innerHTML = tasks
      .map((task) => {
        const owner = person(task.owner);
        const selected = state.selected === task.id ? " is-selected" : "";
        return `
          <article class="card${selected}" data-id="${task.id}">
            <div class="card-top">
              <span class="id">${task.id}</span>
              <span class="chip status-${task.status}">${STATUS_LABEL[task.status]}</span>
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
    if (!task) return;
    state.selected = id;
    const owner = person(task.owner);
    const next = person(task.nextTransferTo);
    const meet = meeting(task.meeting);
    const tone = transferTone(task);

    els.drawer.classList.add("is-open");
    els.backdrop.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.drawer.innerHTML = `
      <div class="drawer-head">
        <span class="id">${task.id}</span>
        <span class="chip status-${task.status}">${STATUS_LABEL[task.status]}</span>
        <button class="filter-chip" id="close-drawer" type="button">Close</button>
      </div>
      <div class="drawer-body">
        <h2 class="drawer-title">${task.title}</h2>
        <div class="xfer-hero is-${tone}">
          <div class="xfer-hero-k">Next transfer time</div>
          <div class="xfer-hero-v">${fmtStamp(task.nextTransferAt)}</div>
          <div class="xfer-rel">${relativeTransfer(task)} · hand to ${next.name} (${next.role})</div>
        </div>
        <div class="meta-grid">
          <div class="meta-cell">
            <div class="meta-k">Owner</div>
            <div class="meta-v who">${avatarHtml(task.owner)} ${owner.name}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">Type</div>
            <div class="meta-v">${TYPE_LABEL[task.type]}</div>
          </div>
          <div class="meta-cell span">
            <div class="meta-k">Current action</div>
            <div class="meta-v">${task.action}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">Meeting</div>
            <div class="meta-v">${meet.title}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-k">When / room</div>
            <div class="meta-v">${fmtStamp(meet.when)} · ${meet.room}</div>
          </div>
        </div>
        <p class="notes">${task.notes}</p>
        <div class="nav-label" style="margin:0 0 8px">Transfer trail</div>
        <div class="trail">
          ${task.trail
            .map((item) => {
              const who = person(item.who);
              return `
                <div class="trail-item">
                  ${avatarHtml(item.who)}
                  <div>
                    <div class="trail-text"><b>${who.name}</b> — ${item.text}</div>
                    <div class="trail-meta">${fmtStamp(item.at)}</div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
    document.getElementById("close-drawer").addEventListener("click", closeDrawer);
    renderRows();
  }

  function closeDrawer() {
    state.selected = null;
    els.drawer.classList.remove("is-open");
    els.backdrop.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    renderRows();
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

    els.search.addEventListener("input", () => {
      state.query = els.search.value;
      renderRows();
    });

    els.rows.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (row) openDrawer(row.dataset.id);
    });

    els.cards.addEventListener("click", (e) => {
      const card = e.target.closest("[data-id]");
      if (card) openDrawer(card.dataset.id);
    });

    els.backdrop.addEventListener("click", closeDrawer);
    els.menu.addEventListener("click", () => {
      els.sidebar.classList.add("is-open");
      els.scrim.classList.add("is-open");
    });
    els.scrim.addEventListener("click", closeMobileNav);

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== els.search) {
        e.preventDefault();
        els.search.focus();
      }
      if (e.key === "Escape") {
        closeDrawer();
        closeMobileNav();
        els.search.blur();
      }
      if ((e.key === "j" || e.key === "k") && document.activeElement !== els.search) {
        const tasks = visibleTasks();
        if (!tasks.length) return;
        const idx = Math.max(0, tasks.findIndex((t) => t.id === state.selected));
        const next = e.key === "j" ? Math.min(tasks.length - 1, (state.selected ? idx + 1 : 0)) : Math.max(0, idx - 1);
        openDrawer(tasks[next].id);
      }
    });
  }

  function closeMobileNav() {
    els.sidebar.classList.remove("is-open");
    els.scrim.classList.remove("is-open");
  }

  function bootViewer() {
    const v = data.viewer;
    const av = document.getElementById("viewer-avatar");
    av.textContent = person(v.id).initials;
    av.setAttribute("style", avatarStyle(v.id));
    document.getElementById("viewer-name").textContent = v.name;
    document.getElementById("viewer-role").textContent = v.role;
    const clock = fmtClock(now);
    document.getElementById("clock-date").textContent = clock.date;
    document.getElementById("clock-time").textContent = clock.time;
  }

  bootViewer();
  renderStats();
  bind();
  renderRows();
})();
