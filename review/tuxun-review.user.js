// ==UserScript==
// @name         图寻复盘导入
// @namespace    https://levine-lai.github.io/canada-geoguessr/review/
// @version      1.0.0
// @description  将自己的已结束对局导入个人复盘地图
// @match        https://tuxun.fun/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const review = "https://levine-lai.github.io/canada-geoguessr/review/";
  const reviewOrigin = new URL(review).origin;
  const api = "/api/v0/tuxun/";
  const validId = (id) => /^[\w-]{1,150}$/.test(String(id ?? ""));
  const ownHistory = ["listSelfAll", "listSelfRating", "listSelfParty", "listSelfMaps", "listSelfOther"];
  const modeNames = {
    main_game: "全球积分", daily_challenge: "每日挑战", challenge: "挑战",
    maps_detail: "地图单人", map: "地图单人", party: "派对", party_game: "派对",
    infinity: "无限练习", country_streak: "国家连击", province_streak: "省份连击",
    map_country_streak: "地图连击",
  };
  const moveNames = { move: "移动", noMove: "不动", npmz: "固定视角" };

  function modeFor(game, item) {
    const type = item.type || game.type;
    const match = type === "solo_match" ? (item.ratingType === "china" || game.ratingType === "china" ? "中国匹配" : "全球匹配") : "";
    const move = moveNames[item.moveType || game.moveType];
    return [match || modeNames[type] || type || "其他", move].filter(Boolean).join(" · ");
  }

  async function get(path, params, signal) {
    const url = new URL(api + path, location.origin);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const deadline = AbortSignal.timeout(12000);
    const response = await fetch(url, { credentials: "same-origin", signal: AbortSignal.any([signal, deadline]) });
    if (!response.ok) {
      const error = new Error(`图寻接口返回 HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const body = await response.json();
    if (!body?.success) {
      const error = new Error(body?.errorMessage || body?.hintMessage || "图寻暂时无法读取这条记录。");
      error.code = body?.errorCode;
      throw error;
    }
    return body.data;
  }

  const number = (value) => value !== null && value !== undefined && String(value).trim() ? Number(value) : NaN;
  const point = (lat, lng) => {
    const coords = [number(lat), number(lng)];
    return Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) <= 180 ? coords : null;
  };

  function gameRounds(game, item, userId) {
    if (!game || !Array.isArray(game.rounds)) return [];
    const finished = ["finish", "finished", "end", "game_end"].includes(game.status);
    const active = ["wait_join", "ready", "ongoing", "match_fail"].includes(game.status);
    if (active || (!finished && !item.gmtEnd)) return [];
    const players = (game.teams || []).flatMap((team) => team.teamUsers || []);
    if (game.player) players.push(game.player);
    const player = players.find((entry) => String(entry.user?.userId) === userId);
    const guesses = new Map((player?.guesses || []).map((guess) => [Number(guess.round), guess]));
    return game.rounds.flatMap((round) => {
      const index = Number(round.round);
      const guess = guesses.get(index);
      if (!Number.isSafeInteger(index) || index < 1 || !guess) return [];
      const truth = point(round.lat, round.lng);
      const picked = point(guess.lat, guess.lng);
      if (!truth || !picked) return [];
      return [{
        gameId: String(item.gameId), userId, round: index, truth, guess: picked,
        score: guess.score ?? null, playedAt: round.endTime || item.gmtEnd || item.gmtCreate || null,
        mode: modeFor(game, item), map: item.mapsName || game.mapsName || "",
        panoId: round.panoId || "", provider: round.provider || round.mapProvider || "",
      }];
    });
  }

  function parseLinks(value) {
    const games = new Map();
    for (const text of value.trim().split(/\s+/).filter(Boolean)) {
      let id = text;
      if (!validId(text)) {
        const url = new URL(text, location.origin);
        const match = url.pathname.match(/^\/solo\/([^/]+)\/?$/);
        if (url.origin !== location.origin) throw new Error("请填写图寻的复盘链接或对局 ID。");
        id = match?.[1] || (/^\/replay(?:-pano|player)?\/?$/.test(url.pathname) && url.searchParams.get("gameId"));
      }
      if (!id || !validId(id)) throw new Error("请填写图寻的复盘链接或对局 ID。");
      games.set(id, { gameId: id });
    }
    if (!games.size) throw new Error("请输入至少一条复盘链接。");
    return [...games.values()];
  }

  function download(payload) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tuxun-review-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;bottom:14px;right:14px;z-index:2147483000";
  const ui = host.attachShadow({ mode: "closed" });
  ui.innerHTML = `
    <style>
      :host { color:#25372e; font: 14px/1.65 "Microsoft YaHei", sans-serif; }
      * { box-sizing:border-box; } [hidden] { display:none!important; }
      button, select, textarea { font:inherit; color:inherit; }
      button, select { min-height:40px; border:1px solid #c4cebe; border-radius:8px; background:#fffefa; padding:4px 10px; }
      button { cursor:pointer; white-space:nowrap; } button:disabled { opacity:.6; cursor:default; }
      .primary { background:#2f5b43; color:#fffefa; border-color:#2f5b43; }
      .launch { box-shadow:0 2px 10px #25372e33; }
      :focus-visible { outline:2px solid #a56732; outline-offset:2px; }
      dialog { width:min(440px,calc(100% - 26px)); max-height:calc(100dvh - 26px); border:1px solid #c4cebe; border-radius:10px; background:#fffefa; color:#25372e; padding:16px; }
      dialog::backdrop { background:#25372e66; }
      header, .actions { display:flex; align-items:center; flex-wrap:wrap; gap:7px; }
      header { justify-content:space-between; }
      h2 { font-size:18px; margin:0; }
      p { margin:8px 0; }
      label { display:block; margin:10px 0 4px; }
      textarea { display:block; width:100%; resize:vertical; padding:6px; border:1px solid #c4cebe; border-radius:8px; }
      .actions { margin-top:10px; }
      .muted { color:#626e63; }
      progress { display:block; width:100%; height:12px; accent-color:#2f5b43; }
    </style>
    <button class="primary launch" type="button">复盘导入</button>
    <dialog aria-labelledby="title">
      <header><h2 id="title">导入我的图寻记录</h2><button id="close" type="button">关闭</button></header>
      <label for="scope">导入范围</label>
      <select id="scope">
        <option value="20">最近 20 局</option><option value="100">最近 100 局</option>
        <option value="all">全部可读取历史</option><option value="links">指定复盘链接</option>
      </select>
      <label id="links-label" for="links" hidden>每行一个复盘链接或对局 ID</label>
      <textarea id="links" rows="3" hidden></textarea>
      <p class="muted">从当前登录的账号读取已结束对局。可导入数量以图寻提供的历史为准。</p>
      <p id="status" role="status"></p><progress id="progress" hidden></progress>
      <div class="actions">
        <button id="start" type="button" class="primary">开始导入</button>
        <button id="stop" type="button" hidden>停止</button>
        <button id="send" type="button" class="primary" hidden>打开复盘地图</button>
        <button id="save" type="button" hidden>下载 JSON</button>
      </div>
    </dialog>`;
  document.body.append(host);
  const element = (id) => ui.getElementById(id);
  const dialog = ui.querySelector("dialog");
  const status = element("status");
  const progress = element("progress");
  const scope = element("scope");
  const links = element("links");
  const start = element("start");
  const stop = element("stop");
  const send = element("send");
  const save = element("save");
  let controller;
  let payload;
  let transferCleanup;

  function show() {
    dialog.showModal();
    if (!controller && !payload) {
      const url = new URL(location.href);
      const current = url.pathname.match(/^\/solo\/([^/]+)$/)?.[1]
        || (/^\/replay(?:-pano|player)?$/.test(url.pathname) && url.searchParams.get("gameId"));
      if (current && validId(current)) {
        scope.value = "links";
        links.value = url.href;
      }
      toggleLinks();
    }
  }

  function toggleLinks() {
    links.hidden = element("links-label").hidden = scope.value !== "links";
  }

  async function run() {
    const chosen = scope.value;
    const input = links.value;
    let manual;
    try {
      if (chosen === "links") manual = parseLinks(input);
    } catch {
      status.textContent = "请填写有效的图寻复盘链接或对局 ID，每行一个。";
      return;
    }
    controller = new AbortController();
    const { signal } = controller;
    start.disabled = scope.disabled = links.disabled = true;
    stop.hidden = false;
    send.hidden = save.hidden = true;
    progress.hidden = false;
    progress.removeAttribute("value");
    status.textContent = "正在读取图寻账号…";
    const rounds = [];
    let failures = 0;
    let empty = 0;
    let total = 0;
    let done = 0;
    let readFailure = "";
    let missedLists = 0;

    try {
      const self = await get("user/getSelfProfile", {}, signal);
      if (!validId(self?.userId)) throw new Error("请先在图寻登录，再开始导入。");
      const userId = String(self.userId);
      let games = manual;
      if (!games) {
        status.textContent = "正在读取比赛历史…";
        const lists = chosen === "all" || chosen === "100" ? ownHistory : ownHistory.slice(0, 1);
        const byId = new Map();
        for (const path of lists) {
          try {
            const history = await get(`history/${path}`, { userId }, signal);
            if (!Array.isArray(history)) throw new Error("图寻返回了未知的历史格式。");
            for (const item of history) {
              if (item?.gmtEnd && validId(item.gameId) && !byId.has(String(item.gameId))) {
                byId.set(String(item.gameId), item);
              }
            }
          } catch (error) {
            if (signal.aborted || error.status === 429 || lists.length === 1) throw error;
            missedLists++;
          }
        }
        if (missedLists === lists.length) throw new Error("暂时无法读取图寻历史，请稍后重试。");
        games = [...byId.values()].sort((a, b) => Number(b.gmtCreate) - Number(a.gmtCreate));
        if (chosen !== "all") games = games.slice(0, Number(chosen));
      }
      total = games.length;
      progress.max = Math.max(1, total);
      progress.value = 0;
      status.textContent = total ? `已读取 0 / ${total} 局` : "未找到可导入的已结束对局。";

      for (const item of games) {
        signal.throwIfAborted();
        try {
          const game = await get("solo/get", { gameId: item.gameId }, signal);
          const rows = gameRounds(game, item, userId);
          if (rows.length) rounds.push(...rows);
          else empty++;
        } catch (error) {
          if (signal.aborted) throw error;
          if (error.status === 429 || error.code === "need_login") throw error;
          failures++;
        }
        done++;
        progress.value = done;
        status.textContent = `已读取 ${done} / ${total} 局，找到 ${rounds.length} 题`;
        if (done < total) await new Promise((resolve) => setTimeout(resolve, 125));
      }
    } catch (error) {
      readFailure = signal.aborted ? "已停止" : error.message;
    } finally {
      const summary = [readFailure, total ? `已读取 ${done} / ${total} 局，找到 ${rounds.length} 题` : "",
        empty ? `${empty} 局无可用的本人猜测` : "", failures ? `${failures} 局读取失败` : "",
        missedLists ? `${missedLists} 类历史暂时无法读取` : ""].filter(Boolean).join("。");
      status.textContent = summary || "未找到可导入的已结束对局。";
      if (rounds.length) payload = { format: "tuxun-review", version: 1, exportedAt: new Date().toISOString(), rounds };
      send.hidden = save.hidden = !payload;
      if (!rounds.length && payload) status.textContent += "。仍可保存上一次导入的记录。";
      start.disabled = scope.disabled = links.disabled = false;
      progress.hidden = stop.hidden = true;
      controller = null;
    }
  }

  function openReview() {
    if (!payload) return;
    const snapshot = payload;
    transferCleanup?.();
    const tab = window.open(review + "?receive=1", "_blank");
    if (!tab) {
      status.textContent = "浏览器阻止了新标签页。可下载 JSON，再到复盘页导入。";
      return;
    }
    const cleanup = () => {
      window.removeEventListener("message", receive);
      clearTimeout(timer);
      transferCleanup = null;
    };
    function receive(event) {
      if (event.origin !== reviewOrigin || event.source !== tab) return;
      if (event.data?.type === "tuxun-review-ready") {
        tab.postMessage({ type: "tuxun-review-import", payload: snapshot }, reviewOrigin);
      } else if (event.data?.type === "tuxun-review-received") {
        status.textContent = "已保存到复盘地图。";
        cleanup();
      } else if (event.data?.type === "tuxun-review-error") {
        status.textContent = "地图保存失败。可下载 JSON 备份。";
        cleanup();
      }
    }
    const timer = setTimeout(() => {
      status.textContent = "未收到地图的保存确认。可下载 JSON 备份。";
      cleanup();
    }, 30000);
    transferCleanup = cleanup;
    window.addEventListener("message", receive);
    status.textContent = "正在将记录保存到复盘地图…";
  }

  ui.querySelector(".launch").addEventListener("click", show);
  element("close").addEventListener("click", () => dialog.close());
  scope.addEventListener("change", toggleLinks);
  start.addEventListener("click", run);
  stop.addEventListener("click", () => controller?.abort());
  send.addEventListener("click", openReview);
  save.addEventListener("click", () => { if (payload) download(payload); });
})();
