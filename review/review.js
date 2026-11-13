(() => {
  "use strict";

  const d = ReviewData;
  const element = (id) => document.getElementById(id);
  const regionFilter = element("region-filter");
  const modeFilter = element("mode-filter");
  const rangeFilter = element("range-filter");
  const sort = element("sort-rounds");
  const lines = element("show-lines");
  const list = element("round-list");
  const regionList = element("region-list");
  const detail = element("round-detail");
  const dialog = element("import-dialog");
  const notice = element("notice");
  const pageSize = 16;
  const tuxunOrigin = "https://tuxun.fun";
  const date = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" });
  const updatedDate = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  const count = new Intl.NumberFormat("zh-CN");
  const pct = (part, total) => total ? `${Math.round(part * 100 / total)}%` : "—";
  const state = { rounds: [], filtered: [], page: 0, selected: null, strongest: false, demo: false };
  let db;
  let startup;
  let regionFor;
  let map;

  function node(tag, className, value) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (value !== undefined) result.textContent = value;
    return result;
  }

  function announce(message, error = false) {
    notice.hidden = !message;
    notice.textContent = message;
    notice.classList.toggle("error", error);
  }

  function options(select, entries) {
    const value = select.value;
    select.length = 1;
    for (const [key, label] of entries) select.add(new Option(label, key));
    select.value = [...select.options].some((option) => option.value === value) ? value : "";
  }

  function setDataset(rows, updated) {
    state.rounds = rows.map((row) => {
      const km = d.distance(row.truth, row.guess);
      return {
        ...row, km, band: d.band(km),
        region: regionFor?.(row.truth) || { code: "unknown", name: "未归类" },
      };
    });
    state.selected = null;
    state.page = 0;
    const groups = d.summarize(state.rounds);
    options(regionFilter, groups.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
      .map((group) => [group.code, group.name]));
    const modes = [...new Set(state.rounds.map((row) => row.mode))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    options(modeFilter, modes.map((mode) => [mode, mode]));
    element("dataset-label").textContent = state.demo ? "示例数据"
      : updated ? `最近导入 ${updatedDate.format(updated)}` : "本机还没有复盘记录";
    element("export-data").hidden = element("clear-data").hidden = !rows.length || state.demo;
    element("open-import").textContent = state.demo ? "导入我的记录" : "＋ 导入记录";
    render();
  }

  function comparableRows() {
    return state.rounds.filter((row) => (!modeFilter.value || row.mode === modeFilter.value)
      && (!rangeFilter.value || row.band === rangeFilter.value));
  }

  function render() {
    const selectedRegion = regionFilter.value;
    const selectedMode = modeFilter.value;
    const selectedRange = rangeFilter.value;
    const comparable = comparableRows();
    state.filtered = comparable.filter((row) => !selectedRegion || row.region.code === selectedRegion);
    const rows = state.filtered;
    if (state.selected && !rows.includes(state.selected)) state.selected = null;

    element("reset-filters").hidden = !(selectedRegion || selectedMode || selectedRange);
    const groups = d.summarize(rows);
    element("stat-count").textContent = count.format(rows.length);
    element("stat-regions").textContent = count.format(groups.filter((group) => group.code !== "unknown").length);
    element("stat-median").textContent = rows.length ? d.formatDistance(d.median(rows.map((row) => row.km))) : "—";
    element("stat-close").textContent = pct(rows.filter((row) => row.band === "close").length, rows.length);
    element("map-empty").hidden = rows.length > 0 && !!map;
    element("map-empty-title").textContent = !map ? "地图暂时无法加载"
      : state.rounds.length ? "没有符合筛选条件的题目" : "地图上还没有答题记录";
    element("demo-button").hidden = !!state.rounds.length || state.demo;
    element("fit-map").disabled = !map;
    lines.disabled = !map;

    map?.setRows(rows, lines.checked);
    map?.select(state.selected, false);
    map?.fit();
    renderRegions(comparable);
    renderRounds();
    renderDetail();
  }

  function renderRegions(rows) {
    regionList.replaceChildren();
    const groups = d.summarize(rows);
    const ranked = groups.filter((group) => group.count >= 3 && group.code !== "unknown");
    const unranked = groups.filter((group) => group.count < 3 || group.code === "unknown");
    ranked.sort((a, b) => (state.strongest ? a.median - b.median : b.median - a.median) || b.count - a.count);
    unranked.sort((a, b) => b.count - a.count);
    if (!groups.length) regionList.append(node("p", "empty-copy", "导入记录后显示地区表现。"));
    for (const group of ranked) regionList.append(regionRow(group));
    if (unranked.length) {
      regionList.append(node("p", "unranked", "样本不足或未归类"));
      for (const group of unranked) regionList.append(regionRow(group));
    }
  }

  function regionRow(group) {
    const row = node("button", "region-row");
    row.type = "button";
    row.setAttribute("aria-pressed", String(group.code === regionFilter.value));
    row.append(node("strong", "", group.name),
      node("span", `distance ${d.band(group.median)}`, d.formatDistance(group.median)),
      node("small", "", `${count.format(group.count)} 题 · 100 km 内 ${pct(group.close, group.count)}`));
    row.addEventListener("click", () => {
      const next = regionFilter.value === group.code ? "" : group.code;
      regionFilter.value = next;
      refreshFilters();
      [...regionList.querySelectorAll("button")].find((button) =>
        button.firstChild.textContent === group.name)?.focus({ preventScroll: true });
    });
    return row;
  }

  function sortedRows() {
    const rows = [...state.filtered];
    if (sort.value === "latest") return rows.sort((a, b) => (b.playedAt ?? 0) - (a.playedAt ?? 0));
    return rows.sort((a, b) => sort.value === "best" ? a.km - b.km : b.km - a.km);
  }

  function renderRounds() {
    const rows = sortedRows();
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    state.page = Math.min(state.page, pageCount - 1);
    element("round-count").textContent = `${count.format(rows.length)} 题`;
    list.replaceChildren();
    if (!rows.length) list.append(node("p", "empty-copy", "暂无符合条件的题目。"));
    for (const row of rows.slice(state.page * pageSize, (state.page + 1) * pageSize)) {
      const button = node("button", "round-row");
      button.type = "button";
      button.dataset.row = row.id;
      button.setAttribute("aria-pressed", String(row === state.selected));
      const metadata = [row.map || row.mode, `第 ${row.round} 轮`, row.playedAt ? date.format(row.playedAt) : ""].filter(Boolean);
      button.append(node("strong", "", row.region.name), node("span", "", metadata.join(" · ")),
        node("span", `distance ${row.band}`, d.formatDistance(row.km)));
      button.addEventListener("click", () => selectRow(row, false));
      list.append(button);
    }
    element("round-pages").hidden = pageCount === 1;
    element("page-number").textContent = `${state.page + 1} / ${pageCount}`;
    element("prev-page").disabled = state.page === 0;
    element("next-page").disabled = state.page + 1 >= pageCount;
  }

  function external(label, href) {
    const link = node("a", "", label);
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  }

  function renderDetail() {
    const row = state.selected;
    detail.replaceChildren();
    detail.hidden = !row;
    if (!row) return;
    const heading = node("div", "detail-head");
    heading.append(node("strong", "", `${row.region.name} · 第 ${row.round} 轮`),
      node("span", `distance ${row.band}`, d.formatDistance(row.km)));
    detail.append(heading);
    const coordinates = ([lat, lng]) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    detail.append(node("p", "", `真实点 ${coordinates(row.truth)} · 猜测点 ${coordinates(row.guess)}`));
    const metadata = [row.map, row.mode, row.score === null ? "" : `${count.format(row.score)} 分`].filter(Boolean);
    detail.append(node("p", "", metadata.join(" · ")));
    const actions = node("div", "detail-links");
    const focus = node("button", "review-text-button", "在地图查看");
    focus.type = "button";
    focus.disabled = !map;
    focus.addEventListener("click", () => {
      map?.fitSelection();
      element("map-title").scrollIntoView({ block: "start" });
    });
    actions.append(focus);
    if (!state.demo) {
      const query = new URLSearchParams({ gameId: row.gameId, round: row.round });
      actions.append(external("图寻原局 ↗", `${tuxunOrigin}/replay?${query}`));
      if (row.panoId) actions.append(external("街景复盘 ↗", `${tuxunOrigin}/replay-pano?${query}`));
    }
    detail.append(actions);
  }

  function selectRow(row, fromMap) {
    state.selected = row;
    if (fromMap) {
      state.page = Math.floor(sortedRows().indexOf(row) / pageSize);
      renderRounds();
    } else {
      for (const button of list.querySelectorAll("button")) {
        button.setAttribute("aria-pressed", String(button.dataset.row === row.id));
      }
    }
    map?.select(row, !fromMap);
    renderDetail();
  }

  function refreshFilters() {
    state.page = 0;
    render();
  }

  function resetFilters() {
    regionFilter.value = modeFilter.value = rangeFilter.value = "";
  }

  async function refreshDatabase() {
    const saved = await d.readDatabase(db);
    state.demo = false;
    resetFilters();
    setDataset(saved.rounds, saved.updated);
  }

  async function importData(payload) {
    const { rounds, skipped } = d.parseBackup(payload);
    if (!rounds.length) throw new Error("文件里没有有效答题记录。");
    await startup;
    if (!db) throw new Error("浏览器无法打开本机记录库。");
    const added = await d.saveRounds(db, rounds);
    await refreshDatabase();
    const pieces = [`新增 ${count.format(added)} 题`];
    if (rounds.length > added) pieces.push(`更新 ${count.format(rounds.length - added)} 道已有题目`);
    if (skipped) pieces.push(`跳过 ${count.format(skipped)} 条无效记录`);
    announce(pieces.join("，") + "。");
  }

  function receiveFromTuxun() {
    const url = new URL(location.href);
    if (!url.searchParams.has("receive")) return;
    url.searchParams.delete("receive");
    history.replaceState(null, "", url);
    const opener = window.opener;
    if (!opener) {
      announce("自动导入连接已断开。请在图寻下载 JSON，再从这里导入。", true);
      return;
    }
    const timer = setTimeout(() => {
      window.removeEventListener("message", receive);
      announce("未收到图寻数据。可下载 JSON 备份后导入。", true);
    }, 30000);
    async function receive(event) {
      if (event.origin !== tuxunOrigin || event.source !== opener || event.data?.type !== "tuxun-review-import") return;
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      try {
        await importData(event.data.payload);
        opener.postMessage({ type: "tuxun-review-received" }, tuxunOrigin);
      } catch (error) {
        announce(error.message || "导入失败，请用 JSON 备份重试。", true);
        opener.postMessage({ type: "tuxun-review-error" }, tuxunOrigin);
      } finally {
        window.opener = null;
      }
    }
    window.addEventListener("message", receive);
    opener.postMessage({ type: "tuxun-review-ready" }, tuxunOrigin);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(d.backup(state.rounds.map(({ km, band, region, ...row }) => row)))],
      { type: "application/json" });
    const link = node("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tuxun-review-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
  }

  async function loadGeometry() {
    const read = async (path) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error("底图加载失败");
      return response.json();
    };
    const results = await Promise.allSettled([read("world.geojson"), read("../designs/china-area-codes/china.geojson")]);
    const empty = { features: [] };
    const world = results[0].value;
    const china = results[1].value;
    regionFor = d.regionIndex(world || empty, china || empty);
    if (world && window.L) map = ReviewMap.init(world, selectRow);
    if (!world || !china) announce("部分底图无法加载，地区归类可能不完整。", true);
  }

  async function boot() {
    const geometry = loadGeometry();
    const dbReady = d.openDatabase().then((database) => { db = database; });
    const booted = Promise.allSettled([geometry, dbReady]);
    element("demo-button").disabled = true;
    const results = await booted;
    element("demo-button").disabled = false;
    if (results[0].status === "rejected") announce("底图暂时无法加载。", true);
    if (!db) {
      setDataset([]);
      announce("浏览器无法打开本机记录库，仍可查看示例。", true);
    } else {
      try {
        await refreshDatabase();
      } catch {
        announce("本机记录读取失败。", true);
      }
    }
  }

  for (const filter of [regionFilter, modeFilter, rangeFilter]) filter.addEventListener("change", refreshFilters);
  element("reset-filters").addEventListener("click", () => { resetFilters(); refreshFilters(); });
  lines.addEventListener("change", () => {
    map?.setRows(state.filtered, lines.checked);
    map?.select(state.selected, false);
  });
  element("fit-map").addEventListener("click", () => map?.fit());
  for (const button of [element("weak-first"), element("strong-first")]) {
    button.addEventListener("click", () => {
      state.strongest = button.id === "strong-first";
      element("strong-first").setAttribute("aria-pressed", String(state.strongest));
      element("weak-first").setAttribute("aria-pressed", String(!state.strongest));
      renderRegions(comparableRows());
    });
  }
  sort.addEventListener("change", () => { state.page = 0; renderRounds(); });
  element("prev-page").addEventListener("click", () => { state.page--; renderRounds(); });
  element("next-page").addEventListener("click", () => { state.page++; renderRounds(); });
  element("open-import").addEventListener("click", () => dialog.showModal());
  element("import-file").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (!file) return;
    dialog.close();
    try {
      const payload = JSON.parse(await file.text());
      await importData(payload);
    } catch (error) {
      announce(error instanceof SyntaxError ? "文件不是有效的 JSON 备份。" : error.message || "导入失败。", true);
    }
  });
  element("demo-button").addEventListener("click", () => {
    state.demo = true;
    resetFilters();
    setDataset(d.demoRounds());
  });
  element("export-data").addEventListener("click", exportData);
  const clearDialog = element("clear-dialog");
  element("clear-data").addEventListener("click", () => {
    clearDialog.returnValue = "";
    clearDialog.showModal();
  });
  clearDialog.addEventListener("close", async () => {
    if (clearDialog.returnValue !== "clear") return;
    try {
      await d.clearRounds(db);
      await refreshDatabase();
      announce("本机记录已清空。");
    } catch {
      announce("清空失败，请重试。", true);
    }
  });

  startup = boot();
  receiveFromTuxun();
})();
