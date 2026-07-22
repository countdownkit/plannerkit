/*
 * plan.js — shared planner/grid renderer (UMD).
 * Required by BOTH generate.js (server) and tool.js (browser) so their output
 * matches exactly. Given a page config + a small state object (rows / time range /
 * week start) it returns the <thead>/<tbody> HTML for the planner grid.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Plan = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function weekdayCols(weekStart) {
    const ws = weekStart === 0 ? 0 : 1;
    const out = [];
    for (let i = 0; i < 7; i++) out.push(WEEKDAYS[(i + ws) % 7]);
    return out;
  }

  function fmtSlot(h, m) {
    const ampm = h < 12 ? "AM" : "PM";
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return hh + ":" + String(m).padStart(2, "0") + " " + ampm;
  }

  function timeSlots(start, end, interval) {
    const out = [];
    const step = interval === 30 ? 30 : 60;
    let t = start * 60;
    const endT = end * 60;
    while (t < endT) {
      out.push(fmtSlot(Math.floor(t / 60), t % 60));
      t += step;
    }
    return out;
  }

  function normCol(c) {
    return typeof c === "string" ? { h: c } : c;
  }

  // The data columns (everything except a generated Time or Day column).
  function dataCols(cfg, weekStart) {
    let out = [];
    if (cfg.leadCol) out.push({ h: cfg.leadCol, wide: true });
    if (cfg.weekdays) {
      out = out.concat(weekdayCols(weekStart).map(function (d) { return { h: d, box: !!cfg.boxCols }; }));
    } else if (cfg.cols) {
      out = out.concat(cfg.cols.map(normCol));
    }
    return out;
  }

  function th(c) {
    const cls = [];
    if (c.wide) cls.push("wide");
    if (c.box) cls.push("boxhead");
    const attr = cls.length ? ' class="' + cls.join(" ") + '"' : "";
    return "<th" + attr + ' contenteditable="true" spellcheck="false">' + c.h + "</th>";
  }

  function cell(c) {
    return c.box
      ? '<td class="boxcell"><span class="box"></span></td>'
      : "<td></td>";
  }

  function theadHTML(cfg, st) {
    let lead = "";
    if (cfg.kind === "time") lead = '<th class="timecol" contenteditable="true" spellcheck="false">' + (cfg.timeCol || "Time") + "</th>";
    else if (cfg.kind === "days") lead = '<th class="daycol" contenteditable="true" spellcheck="false">' + (cfg.dayCol || "Day") + "</th>";
    const cols = dataCols(cfg, st.weekStart).map(th).join("");
    return "<thead><tr>" + lead + cols + "</tr></thead>";
  }

  function tbodyHTML(cfg, st) {
    const cols = dataCols(cfg, st.weekStart);
    const cells = cols.map(cell).join("");
    let rows = "";
    if (cfg.kind === "time") {
      rows = timeSlots(st.start, st.end, st.interval)
        .map(function (s) { return '<tr><td class="timecol">' + s + "</td>" + cells + "</tr>"; })
        .join("");
    } else if (cfg.kind === "days") {
      rows = weekdayCols(st.weekStart)
        .map(function (d) { return '<tr><td class="daycol">' + d + "</td>" + cells + "</tr>"; })
        .join("");
    } else {
      const n = st.rows || 10;
      for (let i = 0; i < n; i++) rows += "<tr>" + cells + "</tr>";
    }
    return "<tbody>" + rows + "</tbody>";
  }

  function tableHTML(cfg, st) {
    return theadHTML(cfg, st) + tbodyHTML(cfg, st);
  }

  // cleaning-schedule style: several labelled sections, each a checkbox list.
  function sectionsHTML(cfg) {
    return cfg.sections.map(function (sec) {
      let body = "";
      for (let i = 0; i < sec.rows; i++) body += '<tr><td class="boxcell"><span class="box"></span></td><td></td></tr>';
      return '<div class="plan-section">' +
        '<h3 class="sec-title" contenteditable="true" spellcheck="false">' + sec.h + "</h3>" +
        '<table class="plan-tbl"><tbody>' + body + "</tbody></table></div>";
    }).join("");
  }

  return {
    weekdayCols: weekdayCols,
    timeSlots: timeSlots,
    theadHTML: theadHTML,
    tbodyHTML: tbodyHTML,
    tableHTML: tableHTML,
    sectionsHTML: sectionsHTML,
  };
});
