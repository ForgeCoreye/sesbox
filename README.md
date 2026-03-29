# sesbox

> ⚠️ **Pilot repo** — this project is under active early development. Expect breaking changes.

---

## What is sesbox?

sesbox is a voice-first creator SaaS that turns voice notes into publishable drafts.

The goal: give creators a lightweight, low-friction way to capture ideas by voice and get clean, ready-to-publish content in return — no manual editing required.

---

## Product Goal

Ship a waitlist-ready MVP that demonstrates the core loop:

1. User records or uploads a voice note
2. sesbox transcribes and structures the content
3. A publishable draft is returned for review or export

---

## Local Development

### Prerequisites

- Node.js >= 18
- A `.env.local` file (see [Environment Variables](#environment-variables) below)

### Install and run

npm install
npm run dev

The app will be available at `http://localhost:3000`.

### Build for production

npm run build
npm start

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

cp .env.example .env.local

Required variables are defined in `.env.example`. No variable should have a hidden default — all required values must be explicitly set before the app will start correctly.

---

## Deployment

**Deploy target: [Vercel](https://vercel.com)**

### Steps

1. Push the repo to GitHub (already at `ForgeCoreye/sesbox`)
2. Import the project in the Vercel dashboard
3. Set all environment variables from `.env.example` in the Vercel project settings
4. Vercel will auto-detect the Next.js framework and apply build defaults

### Assumptions

- No custom `vercel.json` is required unless you need edge functions or custom routing
- The `main` branch is treated as the production branch
- Preview deployments are enabled automatically for all PRs
- No external infra (databases, queues) is assumed at pilot stage — add explicitly as needed

---

## Project Structure

sesbox/
├── app/          # Next.js app router pages and layouts
├── components/   # Shared UI components
├── lib/          # Core logic and utilities
├── public/       # Static assets
├── .env.example  # Environment variable reference (no secrets)
└── README.md

---

## Release Stage

**Pilot** — core UX is being validated. Deployment settings and infra are reviewed explicitly before each change. See task history for rationale on deploy decisions.

---

## Contributing

This is a closed pilot. If you have access, open a PR against `main` with a clear description of the change and its expected output.