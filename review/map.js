(() => {
  "use strict";

  function init(world, onSelect) {
    const root = document.querySelector("#review-map");
    const styles = getComputedStyle(root);
    const color = (name) => styles.getPropertyValue(name).trim();
    const colors = {
      close: color("--map-close"), medium: color("--map-medium"), far: color("--map-far"),
      guess: color("--plate"), white: color("--surface"),
    };
    const map = L.map(root, {
      attributionControl: false, minZoom: 0, maxZoom: 12, zoomSnap: 0.25,
      scrollWheelZoom: false, preferCanvas: true,
      maxBounds: [[-90, -225], [90, 225]], maxBoundsViscosity: 0.9,
    });
    map.zoomControl.remove();
    L.control.zoom({ zoomInTitle: "放大", zoomOutTitle: "缩小" }).addTo(map);
    const worldBounds = [[-62, -177], [79, 177]];
    L.geoJSON(world, {
      interactive: false,
      style: { weight: 0.65, color: color("--map-border"), fillColor: color("--map-land"), fillOpacity: 1 },
    }).addTo(map);
    map.createPane("reviewPaths").style.zIndex = 410;
    map.createPane("reviewPins").style.zIndex = 420;
    map.createPane("reviewSelected").style.zIndex = 430;
    const paths = L.layerGroup().addTo(map);
    const pins = L.layerGroup().addTo(map);
    const detail = L.layerGroup().addTo(map);
    const buckets = new Map();
    let current = [];
    let cycle = null;
    let mapSelection = null;
    const adjustGuess = (row) => {
      const shift = row.guess[1] - row.truth[1];
      return [row.guess[0], row.guess[1] - 360 * Math.round(shift / 360)];
    };

    function path(row, chosen) {
      const guess = adjustGuess(row);
      const options = {
        pane: chosen ? "reviewSelected" : "reviewPaths", interactive: false,
        color: colors[row.band], weight: chosen ? 2 : 1, opacity: chosen ? 1 : 0.32,
        dashArray: chosen ? "6 5" : null,
      };
      const [lat, lng] = row.truth;
      if (Math.abs(guess[1]) <= 180) return L.polyline([row.truth, guess], options);
      const edge = Math.sign(guess[1]) * 180;
      const edgeLat = lat + (guess[0] - lat) * (edge - lng) / (guess[1] - lng);
      return L.polyline([[row.truth, [edgeLat, edge]], [[edgeLat, -edge], row.guess]], options);
    }

    function fit(rows = current) {
      map.invalidateSize({ pan: false });
      if (!rows.length) {
        map.fitBounds(worldBounds, { padding: [10, 10], animate: false });
        return;
      }
      map.fitBounds(L.latLngBounds(rows.map((row) => row.truth)), {
        padding: [32, 32], maxZoom: 8, animate: false,
      });
    }

    function setRows(rows, showLines) {
      paths.clearLayers();
      pins.clearLayers();
      buckets.clear();
      cycle = null;
      current = rows;
      for (const row of rows) {
        const key = row.truth.join(",");
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(row);
        if (showLines) {
          path(row, false).addTo(paths);
          L.circleMarker(row.guess, {
            pane: "reviewPaths", radius: 3, color: colors.guess, weight: 1,
            fillColor: colors.white, fillOpacity: 0.8, interactive: false,
          }).addTo(paths);
        }
      }
      for (const [key, group] of buckets) {
        const row = group.reduce((worst, item) => item.km > worst.km ? item : worst);
        const label = group.length > 1 ? `${row.region.name} · ${group.length} 题`
          : `${row.region.name} · ${ReviewData.formatDistance(row.km)}`;
        const tooltip = document.createElement("span");
        tooltip.textContent = label;
        L.circleMarker(row.truth, {
          pane: "reviewPins", radius: group.length > 1 ? 7 : 5, color: colors.white, weight: 1.2,
          fillColor: colors[row.band], fillOpacity: 0.96,
        }).bindTooltip(tooltip, { direction: "top" }).on("click", () => {
          const index = cycle?.key === key ? (cycle.index + 1) % group.length : 0;
          cycle = { key, index };
          onSelect(group[index], true);
        }).addTo(pins);
      }
    }

    function select(row, focusMap) {
      detail.clearLayers();
      mapSelection = row;
      if (!row) return;
      path(row, true).addTo(detail);
      L.circleMarker(row.truth, {
        pane: "reviewSelected", radius: 8, color: colors.white, weight: 2,
        fillColor: colors[row.band], fillOpacity: 1, interactive: false,
      }).addTo(detail).bindTooltip("真实位置", { permanent: true, direction: "top" });
      L.circleMarker(row.guess, {
        pane: "reviewSelected", radius: 6, color: colors.guess, weight: 2,
        fillColor: colors.white, fillOpacity: 1, interactive: false,
      }).addTo(detail).bindTooltip("我的猜测", { permanent: true, direction: "bottom" });
      if (focusMap) fitSelection();
    }

    function fitSelection() {
      if (!mapSelection) return;
      const points = [mapSelection.truth, mapSelection.guess];
      map.fitBounds(L.latLngBounds(points), { padding: [48, 47], maxZoom: 10, animate: false });
    }

    fit([]);
    return { setRows, select, fit, fitSelection };
  }

  window.ReviewMap = { init };
})();
