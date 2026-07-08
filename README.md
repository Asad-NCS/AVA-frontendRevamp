# AVA Revamp — AdVentures Academy

Frontend revamp for [ava.com.pk](https://ava.com.pk).

**Live:** [ava-frontendrevamp.vercel.app](https://ava-frontendrevamp.vercel.app)

## Stack

- **Frontend:** HTML, CSS, JS (vanilla — no build step needed)
- **Backend:** Node.js + Express
- **Email:** Nodemailer (Gmail)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Gmail credentials (see instructions inside)

# 3. Run locally
npm run dev       # development (auto-restart)
npm start         # production
```

Then open `http://localhost:3000`

## Gmail App Password Setup

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (must be ON)
3. Search "App Passwords"
4. Create one for "Mail" → copy the 16-char password
5. Paste into `.env` as `EMAIL_PASS`

## File Structure
ava-revamp/
├── public/
│   ├── images/           ← Site image assets
│   ├── media/            ← Cards and zigzag graphics
│   ├── uploads/          ← Blog upload assets
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── our-work.html
│   ├── meister.html
│   ├── blog.html
│   ├── meister.js
│   ├── meister-ui.js
│   ├── blog.js
│   ├── blog-admin.js
│   ├── script.js
│   └── styles.css
├── server.js             ← Express + contact form API
├── package.json
├── .env.example           ← Copy to .env
├── .gitignore
└── README.md

## Deployment

Deployed on Vercel via serverless functions.
