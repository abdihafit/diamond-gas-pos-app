# Diamond Gas POS

Diamond Gas POS is a lightweight React and Firebase point-of-sale app for recording LPG sales, tracking agent activity, and reviewing admin totals in real time.

## What The App Does

- lets agents capture customer sales with KG, sell rate, buying rate, and sale date
- auto-calculates sale amount and buy total during entry
- keeps agent records scoped to the signed-in user
- gives admins a live ledger view with daily, weekly, and monthly totals
- supports payment status tracking, including reverting paid sales back to unpaid
- exports the filtered admin ledger as CSV or print-ready PDF

## Core Screens

- `Login`: email/password sign-in for admin and agent users
- `AgentDashboard`: sales entry form plus an editable list of the agent's sales
- `AdminDashboard`: full sales ledger, totals, filters, export actions, and payment updates

## Stack

- React 19 with Vite
- Firebase Authentication
- Cloud Firestore
- Tailwind CSS 4

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in the Firebase web app credentials.
4. Start the app with `npm run dev`.
5. Build production assets with `npm run build`.

## Required Environment Variables

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Project Status

The repository is actively evolving from a simple internal tool into a better-documented, easier-to-maintain production app.
