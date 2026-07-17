# AVA Revamp — AdVentures Academy

Frontend revamp for [ava.com.pk](https://ava.com.pk) — a Pakistani leadership
development and corporate training company.

**Live:** [ava-frontendrevamp.vercel.app](https://ava-frontendrevamp.vercel.app)

---

## Tech Stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| **Frontend**   | Vanilla HTML / CSS / JavaScript (no framework, no build step) |
| **Background** | Custom **WebGL** fragment shader (animated aurora, raw GLSL)  |
| **Server**     | Node.js + **Express**                                         |
| **Database**   | **PostgreSQL** via `pg` (blog posts + contact submissions), hosted on **Neon** |
| **File Uploads** | `multer` (blog media, stored under `public/uploads`)       |
| **Auth**       | Cookie-based admin login (`cookie-parser`), rate-limited      |
| **Hosting**    | Vercel                                                        |

There is **no build step** — the site is static files served by Express,
plus a few JSON APIs for the blog and contact form.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see below)
cp .env.example .env   # then edit .env

# 3. Run locally
npm run dev            # or: npm start
```

Then open `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```bash
# PostgreSQL connection string (e.g. a Neon database)
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require

# Password for the /meister admin dashboard
ADMIN_PASSWORD=your-strong-admin-password

# Optional — defaults to 3000 locally
PORT=3000
```

> On Vercel, set these in **Project Settings → Environment Variables**
> instead of a local `.env` file. Changing them requires a redeploy
> (`vercel --prod`) to take effect — env var changes don't apply
> retroactively to an already-running deployment.

---

## The Animated Background

The flowing aurora background is a hand-written **WebGL fragment shader**
(`public/animations/background.js`). It uses domain-warped fractal Brownian
motion (fbm) — no external library.

It is built to be efficient and mobile-friendly:

- **Adaptive quality** — 5 noise octaves on desktop, 3 on mobile.
- **Resolution cap** — device pixel ratio capped (1.5 desktop / 1.0 mobile)
  so high-DPI phones don't render millions of extra pixels.
- **Frame throttling** — ~30fps on mobile to save battery; 60fps on desktop.
- **Tab-aware** — animation pauses when the tab/page is hidden.
- **Reduced motion** — honors `prefers-reduced-motion`: shows a single
  static frame instead of animating.
- **Fallback** — if WebGL is unavailable, paints a static dark gradient.

The `<body>` is transparent so the fixed canvas shows through; content
cards use `backdrop-filter` glass so the shader glows behind them.

---

## Project Structure

```
ava-revamp/
├── public/
│   ├── animations/
│   │   └── background.js     ← WebGL aurora shader
│   ├── images/                ← Site image assets
│   ├── media/                 ← Card & section graphics
│   ├── uploads/                ← Blog media uploads (images/videos/PDFs)
│   ├── meister/                ← Meister-only pages (not full site duplicates)
│   │   ├── blog.html           ← Admin dashboard (compose/delete posts)
│   │   ├── blog-admin.js
│   │   └── meister-ui.js
│   ├── index.html              ← Home
│   ├── about.html
│   ├── our-work.html
│   ├── blog.html
│   ├── contact.html
│   ├── meister.html            ← Meister login gate
│   ├── script.js                ← Shared site JS (nav, interactions, meister nav injection)
│   ├── blog.js                  ← Blog rendering (shared by public + meister blog pages)
│   ├── meister.js               ← Meister login form logic
│   └── styles.css               ← All styles
├── data/                       ← Legacy seed JSON (live data is in Postgres)
├── scripts/                    ← Maintenance / sync helpers
├── absolutize-assets.js        ← See Maintenance Scripts below
├── bump-cache.js                ← See Maintenance Scripts below
├── server.js                    ← Express server + blog/contact APIs
├── package.json
├── .env.example                 ← Copy to .env
├── .gitignore
└── README.md
```

> **Note on `meister/`:** only `blog.html` (the compose/delete dashboard) is
> a genuinely separate meister-only page. Home, About, Our Work, and Contact
> are **not** duplicated — `/meister/home`, `/meister/about`,
> `/meister/our-work`, and `/meister/contact` all serve the same root-level
> HTML files, with the nav swapped client-side (Meister badge + Log Out
> instead of "Work With Us") by `script.js`. Editing `about.html`,
> `contact.html`, `our-work.html`, or `index.html` updates both the public
> page and its `/meister/*` counterpart automatically.
>
> `/meister` itself (`meister.html`) is the **login gate only**, not a
> content page — once logged in it redirects to `/meister/blog` (the
> dashboard). `/meister/home` is the actual meister-branded homepage.

---

## Maintenance Scripts

Because there's no build step, two small scripts handle cache-busting and
path correctness by hand. Run them (from the repo root) before committing
if you've touched the files they cover:

| Command                          | When to run it                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `node bump-cache.js <version>`    | After editing `script.js` or `blog.js` — bumps their `?v=` query string across all HTML files so Vercel's edge cache and browsers fetch the new version instead of a stale copy. |
| `node absolutize-assets.js`       | After editing a shared page's asset references (`styles.css`, `script.js`, `blog.js`, `animations/background.js`, `media/*`) — rewrites them to absolute paths (`/styles.css`) so they resolve correctly under both `/` and `/meister/*` routes. |

---

## Available Scripts

| Command       | What it does                          |
| ------------- | ------------------------------------- |
| `npm start`   | Start the Express server (production) |
| `npm run dev` | Start the Express server (local dev)  |

---

## Deployment

Deployed on **Vercel**. Pushing to the `main` branch of the connected GitHub
repo triggers a deploy; you can also deploy manually with the Vercel CLI:

```bash
vercel --prod
```

Remember to configure `DATABASE_URL` and `ADMIN_PASSWORD` in the Vercel
project's environment variables.
