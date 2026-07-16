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
| **Database**   | **PostgreSQL** via `pg` (blog posts + contact submissions)    |
| **Auth**       | Cookie-based admin login (`cookie-parser`)                    |
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
> instead of a local `.env` file.

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
│   ├── images/               ← Site image assets
│   ├── media/                ← Card & section graphics
│   ├── uploads/              ← Blog image uploads
│   ├── meister/              ← Separate white-label "Meister" branded site
│   │   ├── index.html  about.html  blog.html  contact.html  our-work.html
│   │   ├── blog-admin.js
│   │   └── meister-ui.js
│   ├── index.html            ← Home
│   ├── about.html
│   ├── our-work.html
│   ├── blog.html
│   ├── contact.html
│   ├── meister.html          ← Meister landing entry
│   ├── script.js             ← Shared site JS (nav, interactions)
│   ├── blog.js               ← Blog rendering
│   ├── meister.js            ← Meister site JS
│   └── styles.css            ← All styles
├── data/                     ← Legacy seed JSON (live data is in Postgres)
├── scripts/                  ← Maintenance / sync helpers
├── server.js                 ← Express server + blog/contact APIs
├── package.json
├── .env.example              ← Copy to .env
├── .gitignore
└── README.md
```

> **Note on `meister/`:** these pages are an intentional, separately branded
> version of the site — not duplicates. Shared style/behavior changes may need
> to be applied to both the main pages and their `meister/` counterparts.

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
vercel deploy --prod
```

Remember to configure `DATABASE_URL` and `ADMIN_PASSWORD` in the Vercel
project's environment variables.
