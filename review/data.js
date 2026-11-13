(() => {
  "use strict";

  const number = (value) => typeof value === "number" || (typeof value === "string" && value.trim())
    ? Number(value) : NaN;
  const coord = (lat, lng) => {
    const point = [number(lat), number(lng)];
    return Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180 ? point : null;
  };
  const identifier = (value) => /^[\w-]{1,150}$/.test(String(value ?? ""));
  const radians = (value) => value * Math.PI / 180;
  const distance = (a, b) => {
    const sine = Math.sin(radians(b[0] - a[0]) / 2) ** 2
      + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(radians(b[1] - a[1]) / 2) ** 2;
    return 12742.0176 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, sine))));
  };
  const band = (km) => km <= 100 ? "close" : km <= 1000 ? "medium" : "far";
  const formatDistance = (km) => km < 1 ? `${Math.round(km * 1000)} m`
    : `${km.toLocaleString("zh-CN", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };

  function parseBackup(payload) {
    if (payload?.format !== "tuxun-review" || payload.version !== 1 || !Array.isArray(payload.rounds)) {
      throw new Error("请选择图寻复盘工具导出的 JSON 备份。");
    }
    const rounds = new Map();
    let skipped = 0;
    for (const row of payload.rounds) {
      const truth = coord(...(Array.isArray(row?.truth) ? row.truth.slice(0, 2) : []));
      const guess = coord(...(Array.isArray(row?.guess) ? row.guess.slice(0, 2) : []));
      const index = number(row?.round);
      if (!truth || !guess || !identifier(row.gameId) || !identifier(row.userId)
          || !Number.isSafeInteger(index) || index < 1) {
        skipped++;
        continue;
      }
      const gameId = String(row.gameId);
      const userId = String(row.userId);
      const date = number(row.playedAt);
      const score = number(row.score);
      const text = (value) => typeof value === "string" ? value.trim().slice(0, 120) : "";
      const id = `${gameId}:${userId}:${index}`;
      rounds.set(id, {
        id, gameId, userId, round: index, truth, guess,
        playedAt: date > 0 && date < 8640000000000000 ? date : null,
        score: Number.isFinite(score) && score >= 0 ? score : null,
        mode: text(row.mode) || "其他", map: text(row.map),
        panoId: text(row.panoId), provider: text(row.provider),
      });
    }
    return { rounds: [...rounds.values()], skipped };
  }

  function backup(rounds) {
    return { format: "tuxun-review", version: 1, exportedAt: new Date().toISOString(), rounds };
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("tuxun-review", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("rounds", { keyPath: "id" });
        request.result.createObjectStore("meta");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function useDatabase(db, mode, callback) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["rounds", "meta"], mode);
      const result = callback(transaction.objectStore("rounds"), transaction.objectStore("meta"));
      transaction.oncomplete = () => resolve(result?.());
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function readDatabase(db) {
    return useDatabase(db, "readonly", (rounds, meta) => {
      const list = rounds.getAll();
      const updated = meta.get("updated");
      return () => ({ rounds: list.result, updated: updated.result });
    });
  }

  function saveRounds(db, rows) {
    return useDatabase(db, "readwrite", (rounds, meta) => {
      let added = 0;
      for (const row of rows) {
        const existing = rounds.getKey(row.id);
        existing.onsuccess = () => {
          if (existing.result === undefined) added++;
          rounds.put(row);
        };
      }
      meta.put(Date.now(), "updated");
      return () => added;
    });
  }

  function clearRounds(db) {
    return useDatabase(db, "readwrite", (rounds, meta) => {
      rounds.clear();
      meta.clear();
    });
  }

  const names = { CHN: "中国", KOR: "韩国", PRK: "朝鲜", TWN: "台湾", HKG: "香港", MAC: "澳门" };
  const polygons = (feature) => feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  function boundary(feature, code, name) {
    return {
      code, name, rings: polygons(feature).map(([outer, ...holes]) => {
        const bounds = [Infinity, Infinity, -Infinity, -Infinity];
        for (const [x, y] of outer) {
          bounds[0] = Math.min(bounds[0], x);
          bounds[1] = Math.min(bounds[1], y);
          bounds[2] = Math.max(bounds[2], x);
          bounds[3] = Math.max(bounds[3], y);
        }
        return { outer, holes, bounds };
      }),
    };
  }

  function inRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  }

  function insideRegion([y, x], region) {
    return region.rings.some(({ outer, holes, bounds: [left, bottom, right, top] }) =>
      x >= left && x <= right && y >= bottom && y <= top
      && inRing(x, y, outer) && !holes.some((ring) => inRing(x, y, ring)));
  }

  function regionIndex(world, china) {
    const countries = world.features.map((f) => boundary(f, f.properties.code, names[f.properties.code] || f.properties.name));
    const provinces = china.features.filter((f) => Number.isInteger(f.properties.adcode))
      .map((f) => boundary(f, String(f.properties.adcode), f.properties.name));
    const fallback = { code: "unknown", name: "未归类" };
    return (point) => {
      const province = point[0] >= 17 && point[0] <= 54 && point[1] >= 73 && point[1] <= 136
        ? provinces.find((region) => insideRegion(point, region)) : null;
      return province || countries.find((region) => insideRegion(point, region)) || fallback;
    };
  }

  function summarize(rows) {
    const groups = new Map();
    for (const row of rows) {
      const key = row.region.code;
      if (!groups.has(key)) groups.set(key, { code: key, name: row.region.name, distances: [], close: 0 });
      const group = groups.get(key);
      group.distances.push(row.km);
      if (row.band === "close") group.close++;
    }
    return [...groups.values()].map((group) => ({
      ...group, count: group.distances.length, median: median(group.distances),
    }));
  }

  function demoRounds() {
    const examples = [
      [[35.68,139.69],[35.64,139.72]], [[34.69,135.50],[34.73,135.45]], [[43.06,141.35],[43.2,141.5]],
      [[33.59,130.40],[33.93,130.93]], [[34.39,132.46],[34.49,132.91]],
      [[-23.55,-46.63],[-34.60,-58.38]], [[-8.05,-34.88],[-23.55,-46.63]], [[-3.12,-60.02],[4.71,-74.07]],
      [[-15.8,-47.88],[-19.92,-43.94]], [[-25.43,-49.27],[-28.7,-49.3]],
      [[45.42,-75.69],[43.65,-79.38]], [[51.04,-114.07],[53.54,-113.49]], [[46.81,-71.21],[45.50,-73.57]],
      [[30.66,104.07],[29.56,106.55]], [[31.47,104.75],[31.2,105.1]], [[28.78,104.62],[28.91,104.62]],
      [[23.13,113.26],[23.00,113.10]], [[22.54,114.06],[22.27,114.15]], [[21.27,110.36],[20.05,110.20]],
      [[-41.29,174.78],[-36.85,174.76]], [[52.23,21.01],[50.06,19.94]],
    ];
    return parseBackup(backup(examples.map(([truth, guess], i) => ({
      truth, guess, round: i % 5 + 1, gameId: `demo-${Math.floor(i / 5)}`, userId: "demo",
      mode: i < 13 ? "全球匹配" : "地图单人",
    })))).rounds;
  }

  window.ReviewData = {
    distance, band, formatDistance, median, parseBackup, backup, openDatabase, readDatabase,
    saveRounds, clearRounds, regionIndex, summarize, demoRounds,
  };
})();
