/*
 * Static generator for the printable planners & schedules site.
 * Run: node generate.js   ->   writes everything into ./public
 *
 * Page families:
 *   /<slug>/    one page per planner type (data/planners.json) — live printable preview
 *   /           homepage (grouped Planners / Schedules / Logs)
 *
 * The artifact IS the page: each page server-renders the actual planner (a paper-styled
 * grid) with editable title and headings. assets/tool.js only adjusts it (title, rows,
 * time range, week start, orientation) and calls window.print(). Grid rendering lives in
 * assets/plan.js, a UMD module shared by BOTH this script and tool.js so their output
 * matches exactly. Print CSS strips everything but the planner.
 */
const fs = require("fs");
const path = require("path");
const Plan = require("./assets/plan.js");

// ---- config -------------------------------------------------------------
const DOMAIN = process.env.DOMAIN || "https://planner.elevatedprogress.com";
const BASE = process.env.BASE || "";
const SITE = "Planner Maker";
const OUT = path.join(__dirname, "public");
const ASSETS = path.join(__dirname, "assets");
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "planners.json"), "utf8"));
const PLANNERS = DATA.planners;

const GROUPS = [
  { id: "planners", label: "Planners", blurb: "Day, week, and to-do planners." },
  { id: "schedules", label: "Schedules", blurb: "Hour-by-hour and weekly time grids." },
  { id: "logs", label: "Charts & Logs", blurb: "Chore charts and tracking logs." },
];

// ---- html layout --------------------------------------------------------
function layout({ title, desc, urlPath, h1, body, cfg }) {
  const canonical = DOMAIN + BASE + urlPath;
  const cfgScript = cfg ? `<script>window.PLAN_CFG=${JSON.stringify(cfg)};</script>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${BASE}/styles.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5580575158570188" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TJY4TRRKD6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-TJY4TRRKD6');</script>
</head>
<body>
<header class="site-head no-print"><div class="wrap">
  <a class="brand" href="${BASE}/">🗓️ ${SITE}</a>
  <nav class="nav"><a href="${BASE}/#planners">Planners</a><a href="${BASE}/#schedules">Schedules</a><a href="${BASE}/#logs">Charts & Logs</a></nav>
</div></header>
<main class="wrap">
  <div class="crumbs no-print"><a href="${BASE}/">Home</a> ›&nbsp;${h1}</div>
  <h1 class="no-print">${h1}</h1>
  ${body}
</main>
<footer class="site-foot no-print"><div class="wrap">
  <a href="${BASE}/">Home</a><a href="${BASE}/#planners">Planners</a><a href="${BASE}/#schedules">Schedules</a><a href="${BASE}/#logs">Charts & Logs</a>
  <span>· ${SITE} — free printable planners and schedules. No downloads, no signups: customize and print. Part of <a href="https://elevatedprogress.com/">Elevated Progress</a>. · <a href="https://elevatedprogress.com/about/">About</a> · <a href="https://elevatedprogress.com/contact/">Contact</a> · <a href="https://elevatedprogress.com/privacy/">Privacy Policy</a></span>
</div></footer>
${cfgScript}
<script src="${BASE}/plan.js" defer></script>
<script src="${BASE}/tool.js" defer></script>
</body>
</html>`;
}
function grid(links) {
  return `<div class="grid">` + links.map(l =>
    `<a href="${BASE}${l.href}">${l.emoji ? `<span class="chip-emoji">${l.emoji}</span>` : ""}${l.label}</a>`).join("") + `</div>`;
}

// ---- controls -----------------------------------------------------------
function fmtH(h) {
  const a = h < 12 ? "AM" : "PM";
  let hh = h % 12; if (hh === 0) hh = 12;
  return hh + " " + a;
}
function hourSelect(id, ctl, label, val) {
  const opts = Array.from({ length: 24 }, (_, h) =>
    `<option value="${h}"${h === val ? " selected" : ""}>${fmtH(h)}</option>`).join("");
  return `<div><label for="${id}">${label}</label><select id="${id}" data-ctl="${ctl}">${opts}</select></div>`;
}
function controlsHTML(cfg) {
  const s = cfg.def;
  const parts = [`<div><label for="t">Title (prints at the top)</label><input type="text" id="t" data-ctl="title" value="${cfg.title}"></div>`];
  if (cfg.kind === "time") {
    parts.push(hourSelect("hs", "start", "Start time", s.start));
    parts.push(hourSelect("he", "end", "End time", s.end));
    parts.push(`<div><label for="hi">Interval</label><select id="hi" data-ctl="interval"><option value="30"${s.interval === 30 ? " selected" : ""}>30 min</option><option value="60"${s.interval !== 30 ? " selected" : ""}>60 min</option></select></div>`);
  }
  if (cfg.kind === "rows") {
    parts.push(`<div><label for="r">Rows</label><select id="r" data-ctl="rows">${[6, 8, 10, 12, 15, 20, 25, 30].map(n => `<option value="${n}"${n === s.rows ? " selected" : ""}>${n} rows</option>`).join("")}</select></div>`);
  }
  if (cfg.weekdays || cfg.kind === "days") {
    const sun = s.weekStart === 0;
    parts.push(`<div><label for="w">Week starts</label><select id="w" data-ctl="weekstart"><option value="1"${sun ? "" : " selected"}>Monday</option><option value="0"${sun ? " selected" : ""}>Sunday</option></select></div>`);
  }
  const land = s.orient === "landscape";
  parts.push(`<div><label for="o">Paper</label><select id="o" data-ctl="orient"><option value="portrait"${land ? "" : " selected"}>Portrait</option><option value="landscape"${land ? " selected" : ""}>Landscape</option></select></div>`);
  parts.push(`<div><label for="d">Date line</label><select id="d" data-ctl="dateline"><option value="1">Show</option><option value="0">Hide</option></select></div>`);
  return `<div class="controls no-print"><div class="row">${parts.join("")}</div>
    <div class="ctl-foot">
      <button type="button" class="print-btn" data-ctl="print">🖨️ Print this planner</button>
      <span class="hint">Tip: click the title or any heading to edit it. "Save as PDF" is a destination in the print dialog.</span>
    </div></div>`;
}

// ---- the planner (paper) ------------------------------------------------
function topBoxHTML() {
  const lines = [1, 2, 3].map(() => `<div class="prio"><span class="box"></span><span class="prio-line"></span></div>`).join("");
  return `<div class="topbox">
    <h3 class="topbox-title" contenteditable="true" spellcheck="false">Top Priorities</h3>
    ${lines}
  </div>`;
}
function plannerHTML(cfg) {
  const land = cfg.def.orient === "landscape";
  let inner;
  if (cfg.kind === "sections") {
    inner = Plan.sectionsHTML(cfg);
  } else {
    const st = {
      rows: cfg.def.rows, start: cfg.def.start, end: cfg.def.end,
      interval: cfg.def.interval, weekStart: cfg.def.weekStart == null ? 1 : cfg.def.weekStart,
    };
    inner = `<table class="plan-tbl" data-tbl>${Plan.tableHTML(cfg, st)}</table>`;
  }
  const top = cfg.topBox ? topBoxHTML() : "";
  return `<div class="sheet${land ? " landscape" : ""}" data-sheet>
    <h2 class="sheet-title" contenteditable="true" spellcheck="false">${cfg.title}</h2>
    <div class="dateline">Date / Week of: ____________________ &nbsp;&nbsp; Name: ____________________</div>
    ${top}
    ${inner}
  </div>`;
}

// ---- write helpers ------------------------------------------------------
const urls = [];
function writePage(urlPath, html) {
  const dir = path.join(OUT, urlPath.replace(/^\/+|\/+$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  urls.push(urlPath);
}

// ---- build --------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) {
  if (entry === ".git" || entry === "CNAME") continue;
  fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
}
for (const f of fs.readdirSync(ASSETS)) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, f));

const linkFor = p => ({ href: `/${p.slug}/`, emoji: p.emoji, label: p.title });

for (const p of PLANNERS) {
  const urlPath = `/${p.slug}/`;
  const title = `Free Printable ${p.title} — Print or Save as PDF`;
  const desc = `${p.blurb.split(". ")[0]}. Customize the title, headings, and layout right on the page, then print — or save as a PDF from the print dialog. No download or signup.`;

  const related = PLANNERS.filter(o => o.group === p.group && o.slug !== p.slug).map(linkFor);

  const body = `${controlsHTML(p)}
  ${plannerHTML(p)}
  <div class="ad-slot no-print">Advertisement</div>
  <div class="prose no-print">
    <p>${p.blurb}</p>
    <p>${p.tip}</p>
    <p><b>To print:</b> adjust the title and layout above (the title and every heading are click-to-edit), then hit Print. <b>To save a PDF instead:</b> choose "Save as PDF" as the printer in the print dialog — same result, no software needed. Everything except the planner is stripped from the printout automatically.</p>
  </div>
  <h2 class="no-print">More ${GROUPS.find(g => g.id === p.group).label.toLowerCase()}</h2>
  <div class="no-print">${grid(related)}</div>
  <div class="ad-slot no-print">Advertisement</div>`;

  writePage(urlPath, layout({ title, desc, urlPath, h1: `Printable ${p.title}`, body, cfg: p }));
}

// -- homepage --
{
  const title = `Free Printable Planners & Schedules — Customize and Print`;
  const desc = `Printable daily planners, weekly planners, hourly schedules, to-do lists, meal planners, chore charts, and more. Edit the title and layout on the page, set your rows or time range, print or save as PDF. Free, no signup.`;
  const sections = GROUPS.map(g => {
    const list = PLANNERS.filter(p => p.group === g.id);
    return `<h2 id="${g.id}">${g.label}</h2>
    <p class="lead">${g.blurb}</p>
    ${grid(list.map(linkFor))}`;
  }).join("\n");
  const body = `<p class="lead">Pick a planner, tweak the title, rows, and time range right on the page, and print. Every one also saves as a PDF from the print dialog — no downloads, no account, nothing to install.</p>
  ${sections}
  <div class="ad-slot no-print">Advertisement</div>
  <div class="prose"><p>These are working tools, not template downloads: the planner you see on each page is the planner that prints. Click the title or a heading to rename it, set the hours or number of rows you need, flip to landscape for wide grids, and the print stylesheet strips everything else off the page automatically.</p></div>
  <div class="prose">
    <h2>Which planner should you print?</h2>
    <p>Reach for a <b>daily planner</b> or <b>hourly planner</b> when you're organizing a single day: the daily planner pairs an hour column with a top-priorities box, while the hourly planner gives you one wide column to block appointments against the clock. To see a whole week on one sheet, the <b>weekly planner</b> leaves open writing space under each day and the <b>weekly schedule</b> lays hours down the side against the seven days. The <b>to-do list</b>, <b>workout log</b>, and <b>chore chart</b> are for tracking rather than time: tick-box tasks, sets and reps, and a checkbox per day. Kitchen and school get their own grids too: the <b>meal planner</b> runs breakfast to snacks across the week, the <b>cleaning schedule</b> splits jobs into daily, weekly, and monthly lists, and the class-schedule sheets print a clean weekday timetable for a binder or the fridge.</p>
    <h2>Customize it before you print</h2>
    <p>Every planner is editable right on the page. Click the title at the top of the sheet, or any column heading, to rename it: turn "Tasks &amp; Notes" into "Calls", or a weekday column into an actual date. Use the controls above the sheet to set the number of rows, pick the start and end hours and 30- or 60-minute slots on the time-based planners, switch the week to start on Sunday or Monday, and flip between portrait and landscape. You can also hide the date line if you don't need it. When it looks right, press Print, and the print stylesheet removes the menus, ads, and controls automatically so only the planner lands on the paper.</p>
    <h2>Common questions</h2>
    <p><b>Can I set the hours on the hourly planner?</b> Yes. Choose any start and end hour and either 30- or 60-minute intervals, so the grid matches your real day instead of a generic 9-to-5. The weekly schedule and class schedules share the same time controls.</p>
    <p><b>How do I save it as a PDF?</b> Press Print, then choose "Save as PDF" as the destination (or printer) in your browser's print dialog. It produces the same result as printing, with no extra software.</p>
    <p><b>Is it really free, with no signup?</b> Yes. Every planner is free to use and print, with no account, email, or download required.</p>
    <p><b>Can I change the column and day headings?</b> Any heading is click-to-edit, including the day names and the sheet title. Rename them to fit what you're planning, then print your version.</p>
    <p><b>Which planners work best in landscape?</b> The wide grids: the weekly planner, weekly schedule, meal planner, chore chart, and class schedules default to landscape, while the daily planner, to-do list, and workout log default to portrait. You can switch either way before printing.</p>
  </div>`;
  writePage(`/`, layout({ title, desc, urlPath: `/`, h1: `Printable Planners &amp; Schedules`, body }));
}

// -- sitemap + robots + meta files --
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${DOMAIN}${BASE}${u}</loc></url>`).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
fs.writeFileSync(path.join(OUT, "CNAME"), "planner.elevatedprogress.com\n");
fs.writeFileSync(path.join(OUT, "ads.txt"), "google.com, pub-5580575158570188, DIRECT, f08c47fec0942fa0\n");

console.log(`Generated ${urls.length} pages into ./public`);
