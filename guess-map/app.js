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
const checked = new Set();
let focusedId = null;
let distanceLimit = $("distance-km").valueAsNumber;
let pending = [];
let deleting = [];

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

function gameRows() {
  return rows.filter((row) => !$("games").value || gameKey(row) === $("games").value);
}

function visibleRows() {
  const operator = $("distance-operator").value;
  const candidates = gameRows();
  if (!operator) return candidates;
  return candidates.filter((row) => operator === "gt" ? row.distanceKm > distanceLimit : row.distanceKm < distanceLimit);
}

function fit() {
  const points = visibleRows().map((row) => row.guess);
  if (points.length) map.fitBounds(points, { padding:[42,42], maxZoom:9 });
  else map.setView([30,104], 3);
}

function replay(row) {
  return origin + "/replay-pano?" + new URLSearchParams({ gameId:row.gameId, round:row.round });
}

function drawMap() {
  const visible = visibleRows();
  pins.clearLayers();
  answers.clearLayers();
  for (const row of visible.filter((row) => !focusedId || row.id === focusedId)) {
    const distance = data.formatDistance(row.distanceKm);
    const label = "第 " + row.round + " 轮 · " + distance;
    const openReplay = () => window.open(replay(row), "_blank", "noopener,noreferrer");
    L.marker(row.guess, {
      title:label + " · 打开原始街景", icon:L.divIcon({ className:"pin", html:String(row.round), iconSize:[24,24], iconAnchor:[12,12] })
    }).bindTooltip(label).on("click", openReplay).addTo(pins);
    if (!focusedId && !$("answers").checked) continue;
    const lng = row.truth[1] - 360 * Math.round((row.truth[1] - row.guess[1]) / 360);
    const target = [row.truth[0],lng];
    L.circleMarker(target, { radius:5, color:"#fff", weight:2, fillColor:"#23a276", fillOpacity:1 })
      .bindPopup(outside("真实位置 · 打开原始街景 ↗", replay(row))).addTo(answers);
    L.polyline([row.guess,target], { color:"#bd5f18", weight:focusedId ? 3 : 2, interactive:false }).addTo(answers);
    const vector = map.project(target,0).subtract(map.project(row.guess,0));
    if (vector.x || vector.y) {
      const tip = document.createElement("div");
      tip.className = "arrow-tip";
      tip.style.setProperty("--angle", Math.atan2(vector.y,vector.x) + "rad");
      L.marker(target, {
        interactive:false, keyboard:false,
        icon:L.divIcon({className:"arrow-icon",html:tip,iconSize:[12,12],iconAnchor:[12,6]})
      }).addTo(answers);
    }
  }
}

function button(label, action) {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = label;
  control.onclick = action;
  return control;
}

function redraw() {
  const visible = visibleRows();
  if (!visible.some((row) => row.id === focusedId)) focusedId = null;
  $("count").textContent = visible.length + " 个猜测";
  $("remove").hidden = !$("games").value;
  $("empty").hidden = visible.length > 0;
  $("empty").textContent = rows.length ? "没有符合筛选条件的回合。" : "导入历史对局，在同一张地图查看你的猜测。";
  $("rounds").replaceChildren();
  for (const row of visible) {
    const line = document.createElement("div");
    line.className = "round";
    const focus = button("第 " + row.round + " 轮 · " + data.formatDistance(row.distanceKm), () => {
      focusedId = focusedId === row.id ? null : row.id;
      for (const control of $("rounds").querySelectorAll(".round-focus")) {
        control.setAttribute("aria-pressed", String(control === focus && !!focusedId));
      }
      drawMap();
      if (focusedId) {
        const shift = 360 * Math.round((row.truth[1] - row.guess[1]) / 360);
        map.fitBounds([row.guess,[row.truth[0],row.truth[1]-shift]], {padding:[42,42],maxZoom:15});
      } else fit();
    });
    focus.className = "round-focus";
    focus.setAttribute("aria-pressed", String(row.id === focusedId));
    const remove = button("移除", () => confirmRemoval([row], "移除这一轮？"));
    remove.className = "round-remove";
    line.append(focus, outside("街景 ↗", replay(row)), remove);
    $("rounds").append(line);
  }
  drawMap();
}

async function refresh() {
  rows = (await data.readDatabase(database)).rounds.sort((a,b) => b.playedAt - a.playedAt || a.round - b.round);
  for (const row of rows) row.distanceKm = data.distance(row.truth,row.guess);
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
  $("history-tools").hidden = !history.size;
  const known = new Set(rows.map(gameKey));
  for (const item of history.values()) {
    const row = document.createElement("div");
    row.className = "history-row";
    const labelControl = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked.has(item.gameId);
    checkbox.onchange = () => {
      if (checkbox.checked) checked.add(item.gameId);
      else checked.delete(item.gameId);
      updateHistoryButtons();
    };
    const label = [item.gmtCreate ? date.format(item.gmtCreate) : item.gameId,
      item.mapsName || typeName[item.type] || item.type || "对局",
      known.has(gameKey(item)) ? "已导入" : ""].filter(Boolean).join(" · ");
    labelControl.append(checkbox,document.createTextNode(label));
    row.append(labelControl,outside("数据 ↗", gameDataUrl(item.gameId)));
    $("history-list").append(row);
  }
  updateHistoryButtons();
}

const gameDataUrl = (id) => api + "solo/get?" + new URLSearchParams({gameId:id});
const checkedRows = () => rows.filter((row) => checked.has(row.gameId) && String(history.get(row.gameId)?.userId) === row.userId);

function updateHistoryButtons() {
  $("clear-selection").disabled = !checked.size;
  $("import-selected").disabled = !checked.size;
  $("remove-selected").disabled = !checkedRows().length;
}

function convert(game, userId, expectedId) {
  if (!Array.isArray(game?.rounds)) throw new Error("未找到对局回合。");
  if (game.status !== "finish") throw new Error("请选择一局已结束的对局。");
  const id = game.gameId ?? game.id ?? expectedId ?? $("raw-game-id").value.trim();
  if (expectedId && String(id) !== expectedId) throw new Error("粘贴的数据与当前所选对局不匹配。");
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
$("fit").onclick = () => { focusedId = null; $("games").value = ""; redraw(); fit(); };
$("answers").onchange = drawMap;
$("games").onchange = () => { redraw(); fit(); };
$("distance-operator").onchange = () => { redraw(); fit(); };
$("distance-km").oninput = () => {
  const field = $("distance-km");
  const valid = field.validity.valid && Number.isSafeInteger(field.valueAsNumber);
  $("distance-error").hidden = valid;
  field.setAttribute("aria-invalid", String(!valid));
  if (!valid) return;
  distanceLimit = field.valueAsNumber;
  if ($("distance-operator").value) { redraw(); fit(); }
};
$("remove").onclick = () => confirmRemoval(gameRows(), "移除这局的所有回合？");

function confirmRemoval(entries, title) {
  if (!entries.length) return;
  deleting = entries.map((row) => row.id);
  $("delete-title").textContent = title;
  $("confirm-delete").returnValue = "";
  $("confirm-delete").showModal();
}

$("confirm-delete").onclose = async () => {
  const ids = deleting;
  deleting = [];
  if ($("confirm-delete").returnValue !== "delete") return;
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("rounds", "readwrite");
      const store = transaction.objectStore("rounds");
      for (const id of ids) store.delete(id);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error);
    });
    await refresh();
    renderHistory();
    summary("已移除 " + ids.length + " 个猜测。");
  } catch { summary("删除失败，请重试。"); }
};

const ready = data.openDatabase().then((db) => {
  database = db;
  return refresh();
}).catch(() => summary("无法打开当前浏览器的记录库。"));

$("select-all").onclick = () => {
  for (const id of history.keys()) checked.add(id);
  renderHistory();
};
$("clear-selection").onclick = () => {
  checked.clear();
  pending = [];
  $("pending-payload").value = "";
  renderPending();
  renderHistory();
};
$("remove-selected").onclick = () => confirmRemoval(checkedRows(), "移除所选对局的所有回合？");

function renderPending() {
  const item = pending[0];
  $("pending-import").hidden = !item;
  if (!item) return;
  $("pending-source").href = gameDataUrl(item.gameId);
  const when = item.gmtCreate ? date.format(item.gmtCreate) : item.gameId;
  $("pending-status").textContent = when + " · 还有 " + pending.length + " 局待导入";
}

async function saveImported(entries, userId) {
  const imported = data.parseBackup(entries).rounds.filter((row) => row.userId === userId);
  if (!imported.length) throw new Error("没有找到有效的本人猜测坐标。");
  const added = await data.saveRounds(database,imported);
  await refresh();
  renderHistory();
  const message = "已读取 " + imported.length + " 个猜测，新增 " + added + " 个。";
  $("import-status").textContent = message;
  summary(message);
}

$("import-selected").onclick = () => {
  pending = [...checked].map((id) => history.get(id)).filter(Boolean);
  $("pending-payload").value = "";
  renderPending();
};

$("save-pending").onclick = async () => {
  const item = pending[0];
  if (!item) return;
  const control = $("save-pending");
  control.disabled = true;
  try {
    await ready;
    if (!database) throw new Error("无法打开当前浏览器的记录库。");
    const payload = JSON.parse($("pending-payload").value);
    if (payload.success === false) throw new Error("请在登录图寻后重新打开该数据页。");
    const userId = String(item.userId);
    await saveImported(data.backup(convert(payload.data ?? payload, userId, item.gameId)), userId);
    if (pending[0] === item) pending.shift();
    $("pending-payload").value = "";
    renderPending();
  } catch (error) {
    $("pending-status").textContent = error instanceof SyntaxError ? "请粘贴当前对局的完整数据。" : error.message;
  } finally { control.disabled = false; }
};

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
      checked.clear();
      pending = [];
      renderPending();
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
      await saveImported(backup,userId);
      $("raw-game-id").value = "";
      $("game-id-field").hidden = true;
    }
    $("payload").value = "";
  } catch (error) {
    status.textContent = error instanceof SyntaxError ? "请复制数据页里的完整 JSON 内容。" : error.message;
  }
};

loadBasemap();
