# CLAUDE.md — plannerkit

Project instructions for Claude Code working in this repo. Inherits the ElevatedProgress
venture playbook from the parent folder's CLAUDE.md.

## What this is

A zero-dependency static-site generator for **free printable planners & schedules** (daily
planner, weekly planner, hourly planner, weekly schedule, to-do list, meal planner, chore
chart, cleaning schedule, workout log, class schedule). `generate.js` reads
`data/planners.json` + `assets/` and writes one page per planner type into `public/`.
Target: https://planner.elevatedprogress.com/. Sibling of `sheetkit` — same "printable
artifact IS the page" model, a different (large, evergreen) query family.

## The product rule

**The artifact IS the page.** Each page server-renders the actual planner (a paper-styled
grid); `assets/tool.js` only adjusts it (title, rows, time range, week start, orientation)
and calls `window.print()`. The title and every heading are `contenteditable`. Print CSS
strips everything with `.no-print`; "save as PDF" is just the print dialog. Never turn this
into a download/builder flow — instant-print is the differentiator vs the template mills.

Grid rendering (time slots, weekday columns, checkbox cells, sections) lives in
`assets/plan.js`, a UMD module required by BOTH `generate.js` (server) and `tool.js`
(browser) so their output matches exactly. Each page embeds its config as
`window.PLAN_CFG`; `tool.js` reads it + the control values and re-renders from `plan.js`.
Server and client MUST stay in sync — change the render logic only in `plan.js`.

## Planner "kinds" (in data/planners.json)

- `time` — a generated Time column + data columns; controls set start/end hour + 30/60-min
  interval. Data columns are either explicit (`cols`) or the 7 weekdays (`weekdays: true`).
- `rows` — N generic rows of the given `cols` (or weekday columns); a `rows` control.
  `boxCols: true` makes the weekday cells checkboxes (chore chart); `leadCol` prepends a
  text column; a `col` with `box: true` renders a checkbox cell.
- `days` — the 7 weekdays as rows, `cols` (e.g. meals) as columns.
- `sections` — labelled checkbox sections (cleaning schedule), from `sections`.

`weekdays`/`days` kinds get a week-start (Sun/Mon) control. `topBox: true` adds a Top
Priorities box (daily planner). Every page gets orientation + date-line controls.

## Deploy — just push

`git push` to `main` is the deploy — GitHub Actions (`.github/workflows/deploy.yml`).

- **Never manually build and commit output.** `public/` is git-ignored build output.
- **Never hand-edit anything in `public/`.**
- Commit as the neutral identity:
  `git -c user.name="plannerkit" -c user.email="plannerkit@users.noreply.github.com" commit …`

## Local build / preview

```
node generate.js     # writes ./public
node server.js       # preview at http://localhost:5065 (5060/5061 are Chrome-blocked SIP ports)
```

## Adding a planner

Add an entry to `data/planners.json`: slug (match the real search, e.g. "weekly-planner"),
title, emoji, group (`planners` / `schedules` / `logs`), kind + its config, honest
blurb + tip. It gets its own SEO page and is grouped on the homepage automatically.

## Don't break these (generated, must keep serving)

- `ads.txt` + AdSense loader in `<head>` — publisher `ca-pub-5580575158570188`.
- GA4 `G-TJY4TRRKD6` (shared across all EP sites; hostname splits them).
- `sitemap.xml`, `robots.txt`, `.nojekyll`, `CNAME` (planner.elevatedprogress.com).
- GSC verification file once the property is verified.

## Config knobs

`DOMAIN` and `BASE`, same semantics as the other tools. Production values in the workflow.
