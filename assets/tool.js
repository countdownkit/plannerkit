// Planner controls: title, rows, time range, week start, orientation, date line, print.
// The planner itself is server-rendered; this only adjusts it, re-rendering the grid
// from the SAME plan.js module the server used so the output matches exactly.
(function () {
  const cfg = window.PLAN_CFG;
  const sheet = document.querySelector("[data-sheet]");
  if (!cfg || !sheet || typeof Plan === "undefined") return;
  const tbl = sheet.querySelector("[data-tbl]");
  const titleEl = sheet.querySelector(".sheet-title");
  const dateline = sheet.querySelector(".dateline");
  const ctl = name => document.querySelector(`[data-ctl=${name}]`);

  function state() {
    return {
      rows: ctl("rows") ? +ctl("rows").value : cfg.def.rows,
      start: ctl("start") ? +ctl("start").value : cfg.def.start,
      end: ctl("end") ? +ctl("end").value : cfg.def.end,
      interval: ctl("interval") ? +ctl("interval").value : cfg.def.interval,
      weekStart: ctl("weekstart") ? +ctl("weekstart").value : (cfg.def.weekStart == null ? 1 : cfg.def.weekStart),
    };
  }

  // Orientation is a real @page rule so the print dialog defaults correctly.
  const pageStyle = document.createElement("style");
  document.head.appendChild(pageStyle);
  function setOrient(o) {
    pageStyle.textContent = `@page { size: letter ${o}; margin: 0.5in; }`;
    sheet.classList.toggle("landscape", o === "landscape");
  }

  // Rows / time changes: swap only the tbody so edited headings survive.
  function reBody() {
    if (!tbl) return;
    const body = tbl.querySelector("tbody");
    if (body) body.outerHTML = Plan.tbodyHTML(cfg, state());
  }
  // Week-start reorders columns, so rebuild the whole table.
  function reTable() {
    if (!tbl) return;
    tbl.innerHTML = Plan.tableHTML(cfg, state());
  }

  if (titleEl && ctl("title")) {
    ctl("title").addEventListener("input", e => { titleEl.textContent = e.target.value; });
    titleEl.addEventListener("input", () => { ctl("title").value = titleEl.textContent; });
  }
  ["start", "end", "interval", "rows"].forEach(n => { if (ctl(n)) ctl(n).addEventListener("change", reBody); });
  if (ctl("weekstart")) ctl("weekstart").addEventListener("change", reTable);
  if (ctl("orient")) ctl("orient").addEventListener("change", e => setOrient(e.target.value));
  if (ctl("dateline")) ctl("dateline").addEventListener("change", e => { if (dateline) dateline.style.display = +e.target.value ? "" : "none"; });
  if (ctl("print")) ctl("print").addEventListener("click", () => window.print());

  if (ctl("orient")) setOrient(ctl("orient").value);
})();
