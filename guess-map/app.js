"use strict";

const $ = (id) => document.getElementById(id);
const data = window.ReviewData;
const origin = "https://tuxun.fun";
const api = origin + "/api/v0/tuxun/";
const source = "https://b68res.daai.fun/tuxun/umi.1794678200488.8fc070b7.js";
const gameKey = (row) => row.gameId + ":" + row.userId;
const gameId = (value) => /^[\w-]{1,150}$/.test(value ?? "");
const date = new Intl.DateTimeFormat("zh-CN", { dateStyle:"short", timeStyle:"short" });
const typeName = { rank:"排位赛", team:"组队对决", solo_match:"积分匹配", daily_challenge:"每日挑战" };
const summary = (message) => { $("feedback").textContent = message; };
const map = L.map("map", { worldCopyJump:true, maxZoom:18 }).setView([30, 104], 3);
const pins = L.layerGroup().addTo(map);
const answers = L.layerGroup().addTo(map);
let database, rows = [];
let history = new Map();

function outside(label, url) {
  const link = document.createElement("a");
  link.textContent = label;
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

async function loadBasemap() {
  try {
    const script = await fetch(source, { signal:AbortSignal.timeout(12000) });
    if (!script.ok) throw new Error();
    const tile = (await script.text()).match(/https:\/\/maprastertile[^"\s]+/)?.[0];
    if (!tile?.includes("/{z}/{x}/{y}/")) throw new Error();
    const layer = L.tileLayer(tile, { maxZoom:18, attribution:"华为地图 · 图寻" });
    let loaded = false;
    layer.on("tileload", () => { loaded = true; });
    layer.once("load", () => {
      if (!loaded) { layer.remove(); fallback(); }
    });
    layer.addTo(map);
  } catch {
    await fallback();
  }
}

async function fallback() {
  summary("图寻底图暂不可用，已切换到简化底图。");
  try {
    const response = await fetch("../review/world.geojson");
    if (!response.ok) throw new Error();
    L.geoJSON(await response.json(), {
      interactive:false, style:{ color:"#9d9e81", fillColor:"#e8e9d5", fillOpacity:1, weight:1 }
    }).addTo(map).bringToBack();
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  } catch {
    summary("底图暂不可用，仍可查看落点。");
  }
}

function visibleRows() {
  return rows.filter((row) => !$("games").value || gameKey(row) === $("games").value);
}

function fit() {
  const points = visibleRows().map((row) => row.guess);
  if (points.length) map.fitBounds(points, { padding:[42,42], maxZoom:9 });
  else map.setView([30,104], 3);
}

function replay(row) {
  return origin + "/replay-pano?" + new URLSearchParams({ gameId:row.gameId, round:row.round });
}

function redraw() {
  const visible = visibleRows();
  $("count").textContent = visible.length + " 个猜测";
  $("remove").hidden = !$("games").value;
  $("empty").hidden = visible.length > 0;
  $("rounds").replaceChildren();
  pins.clearLayers();
  answers.clearLayers();
  for (const row of visible) {
    const distance = data.formatDistance(data.distance(row.truth,row.guess));
    const label = "第 " + row.round + " 轮 · " + distance;
    const link = outside(label, replay(row));
    link.className = "round";
    link.title = "在图寻打开该回合街景";
    $("rounds").append(link);
    const openReplay = () => window.open(replay(row), "_blank", "noopener,noreferrer");
    L.marker(row.guess, {
      title:label + " · 打开原始街景", icon:L.divIcon({ className:"pin", html:String(row.round), iconSize:[24,24], iconAnchor:[12,12] })
    }).bindTooltip(label).on("click", openReplay).addTo(pins);
    if (!$("answers").checked) continue;
    L.circleMarker(row.truth, { radius:5, color:"#fff", weight:2, fillColor:"#23a276", fillOpacity:1 })
      .bindPopup(outside("真实位置 · 打开原始街景 ↗", replay(row))).addTo(answers);
    const lng = row.guess[1] - 360 * Math.round((row.guess[1] - row.truth[1]) / 360);
    L.polyline([row.truth, [row.guess[0],lng]], { color:"#bd5f18", weight:1.5, interactive:false }).addTo(answers);
  }
}

async function refresh() {
  rows = (await data.readDatabase(database)).rounds.sort((a,b) => b.playedAt - a.playedAt || a.round - b.round);
  const selection = $("games").value;
  $("games").length = 1;
  const byGame = new Map(rows.map((row) => [gameKey(row),row]));
  for (const [key,row] of byGame) {
    const when = row.playedAt ? date.format(row.playedAt) : row.gameId;
    $("games").add(new Option(when + " · " + (row.map || row.mode),key));
  }
  $("games").value = byGame.has(selection) ? selection : "";
  redraw();
  fit();
}

function renderHistory() {
  $("history-list").replaceChildren();
  const known = new Set(rows.map((row) => row.gameId));
  for (const item of history.values()) {
    const label = [item.gmtCreate ? date.format(item.gmtCreate) : item.gameId,
      item.mapsName || typeName[item.type] || item.type || "对局", known.has(item.gameId) ? "已导入" : ""].filter(Boolean).join(" · ");
    $("history-list").append(outside(label, api + "solo/get?" + new URLSearchParams({gameId:item.gameId})));
  }
}

function convert(game, userId) {
  if (!Array.isArray(game?.rounds)) throw new Error("未找到对局回合。");
  if (game.status !== "finish") throw new Error("请选择一局已结束的对局。");
  const id = game.gameId ?? game.id ?? $("raw-game-id").value.trim();
  const players = (Array.isArray(game.teams) ? game.teams : []).flatMap((team) => team.teamUsers || []);
  if (game.player) players.push(game.player);
  const player = players.find((item) => String(item.user?.userId) === userId);
  if (!player) throw new Error("这局没有该用户的猜测，请核对用户 ID。");
  if (!gameId(id)) throw new Error("缺少对局 ID。");
  const item = history.get(id);
  const guesses = new Map((player.guesses || []).map((guess) => [String(guess.round),guess]));
  return game.rounds.flatMap((round) => {
    const guess = guesses.get(String(round.round));
    return guess ? [{
      gameId:id, userId, round:round.round, truth:[round.lat,round.lng], guess:[guess.lat,guess.lng],
      playedAt:round.endTime ?? item?.gmtCreate, score:guess.score, panoId:round.panoId, provider:round.source,
      mode:typeName[item?.type ?? game.type] || item?.type || game.type, map:item?.mapsName || game.mapsName
    }] : [];
  });
}

$("history").href = api + "history/listSelfAll";
$("import").onclick = () => $("importer").showModal();
$("close").onclick = () => $("importer").close();
$("fit").onclick = fit;
$("answers").onchange = redraw;
$("games").onchange = () => { redraw(); fit(); };
$("remove").onclick = () => {
  $("confirm-delete").returnValue = "";
  $("confirm-delete").showModal();
};
$("confirm-delete").onclose = async () => {
  if ($("confirm-delete").returnValue !== "delete") return;
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("rounds", "readwrite");
      const store = transaction.objectStore("rounds");
      for (const row of visibleRows()) store.delete(row.id);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error);
    });
    await refresh();
    renderHistory();
    summary("已删除所选对局。");
  } catch { summary("删除失败，请重试。"); }
};

const ready = data.openDatabase().then((db) => {
  database = db;
  return refresh();
}).catch(() => summary("无法打开当前浏览器的记录库。"));

$("import-form").onsubmit = async (event) => {
  event.preventDefault();
  const status = $("import-status");
  try {
    await ready;
    if (!database) throw new Error("无法打开当前浏览器的记录库。");
    const payload = JSON.parse($("payload").value);
    const userId = $("user-id").value.trim();
    if (payload.success === false) throw new Error("请在登录图寻后重新打开该数据页。");
    if (payload.success === true && Array.isArray(payload.data)) {
      const items = payload.data.filter((item) =>
        item?.gmtEnd && gameId(item.gameId) && String(item.userId) === userId);
      history = new Map(items.map((item) => [item.gameId,item]));
      renderHistory();
      status.textContent = items.length ? "已载入 " + history.size + " 局历史，选择一局读取其落点。"
        : "没有找到该用户已结束的对局。请登录图寻并核对用户 ID。";
    } else {
      const content = payload.data ?? payload;
      if (payload.format !== "tuxun-review" && !gameId(content?.gameId ?? content?.id)) {
        $("game-id-field").hidden = false;
        const value = $("raw-game-id").value.trim();
        if (value.startsWith(origin + "/")) $("raw-game-id").value = new URL(value).searchParams.get("gameId") || "";
      }
      const backup = payload.format === "tuxun-review" ? payload : data.backup(convert(content,userId));
      const imported = data.parseBackup(backup).rounds.filter((row) => row.userId === userId);
      if (!imported.length) throw new Error("没有找到有效的本人猜测坐标。");
      const added = await data.saveRounds(database,imported);
      await refresh();
      renderHistory();
      status.textContent = "已读取 " + imported.length + " 个猜测，新增 " + added + " 个。";
      summary(status.textContent);
      $("raw-game-id").value = "";
      $("game-id-field").hidden = true;
    }
    $("payload").value = "";
  } catch (error) {
    status.textContent = error instanceof SyntaxError ? "请复制数据页里的完整 JSON 内容。" : error.message;
  }
};

loadBasemap();
