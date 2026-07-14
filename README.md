# Setter Dashboard

EOD report tracker for appointment setters, in Systemised Scaling branding
(theme lifted from www.systemised-scaling.com). Self-owned static site (free
to host) storing every report in a **Google Sheet** Tom owns. No Lovable, no
Supabase, no logins.

## The two links

- **`/`** (site root) — the setter's form (share this one). Sections:
  - **Dials:** dials made, dials answered, meetings proposed, meetings booked (dials)
  - **Cold Email:** emails responded to, meetings proposed (email), meetings booked (email)
  - **LinkedIn:** connection requests, accepts, DMs sent, replies, positive replies, meetings booked (LI)
  - **Sales Rep Hiring:** messages sent, hiring links sent, rep applications submitted
  - **Miscellaneous:** messages sent, dials made, meetings proposed, meetings booked
  - Notes + objections heard. One report per setter per day — resubmitting
    the same day updates the row instead of duplicating it.
- **`/#/hq-ss-2417`** — Tom's analytics dashboard (path defined in
  [`src/lib/paths.ts`](src/lib/paths.ts)): KPIs, a Rates panel (pickup rate,
  proposed rate, booking rate, email booking, LI accept rate, hiring
  application rate), meetings-booked-per-day chart stacked by channel,
  channel breakdown, hiring funnel, recent reports. Filter by setter and
  date range.

There's no login. The dashboard is hidden only by its unguessable URL and
nothing on the setter-facing form links to it — keep that URL private. Any
unknown path falls back to the form.

## Backend (already set up)

The "database" is Tom's "Setter EOD Reports" Google Sheet with
[`apps-script/Code.gs`](apps-script/Code.gs) deployed inside it as a web app
(Extensions → Apps Script → Deploy → Web app, Execute as: Me, access:
Anyone). The `/exec` URL is baked into `API_URL` in
[`src/lib/api.ts`](src/lib/api.ts).

The script auto-creates two tabs: **Reports** (one row per setter per day;
resubmits update the row) and **Setters** — names typed in column A of the
Setters tab appear in the form's dropdown. All data lives in the Sheet.

If Code.gs changes, re-paste it in Apps Script and **Deploy → Manage
deployments → edit (pencil) → Version: New version** so the same /exec URL
keeps working.

To change the metrics later, update `EOD_FIELDS`/`EOD_SECTIONS` in
[`src/lib/eodFields.ts`](src/lib/eodFields.ts) and `METRIC_KEYS` in
`Code.gs` (new columns are appended to the Reports tab header).

## Run locally

```sh
npm install
npm run dev        # http://localhost:5180
```

Tip: point the app at a different backend without rebuilding via the browser
console: `localStorage.setItem('eod_api_url', 'https://…/exec')`.

## Deploy

`npm run build` outputs a fully static `dist/` (relative paths + hash
routing), so it works on any static host — GitHub Pages, Netlify, Vercel,
Cloudflare Pages — with no special configuration.
