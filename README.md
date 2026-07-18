# ⟳ Reloaded VPS

A complete, self-contained VPS hosting business website — pure HTML/CSS/JS, no build step, no backend. Deploys straight to **GitHub Pages** (or any static host).

![status](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-7c5cff) ![deps](https://img.shields.io/badge/dependencies-none-2ee6a8)

## What's inside

| Page | Purpose |
|---|---|
| `index.html` | Landing page — hero, features, pricing with 1/3/6/12-month billing toggle, FAQ |
| `register.html` / `login.html` | Client & admin authentication |
| `checkout.html` | Order configuration + simulated payment |
| `dashboard.html` | **Client area / billing portal** — overview stats, active services with server credentials, order & invoice history, support tickets |
| `admin.html` | **Admin panel** — revenue stats, order fulfillment queue, one-click random VPS detail generator, proof-of-fulfillment records, ticket inbox, client list |

## Pricing

| Plan | 1 Month | 3 Months | 6 Months | 1 Year |
|---|---|---|---|---|
| Ignite   | $15 | $40 | $70  | $120 |
| Velocity | $25 | $65 | $90  | $140 |
| Titan    | $32 | $67 | $100 | $150 |

## The full business flow

1. Visitor picks a plan and billing cycle → registers → checks out (payment is simulated).
2. The order appears in the client area as **Provisioning** and in the admin panel as **Awaiting fulfillment**.
3. Admin clicks **Fulfill** → 🎲 generates random VPS details (hostname, IP, root password, OS, datacenter) — editable before delivery.
4. On delivery a **Proof of Fulfillment** record (`POF-…`) is stored: who fulfilled it, when, and a snapshot of exactly what was delivered.
5. The service instantly appears in the client area with copy-to-clipboard credentials.
6. Clients open **support tickets** (optionally linked to a service); admins reply from the ticket inbox; the conversation threads in both portals.

## Default admin account

```
Email:    admin@reloadedvps.com
Password: admin123
```

The admin account is auto-seeded on first visit. Client accounts are created via the register page.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Reloaded VPS"
git branch -M main
git remote add origin https://github.com/<you>/reloaded-vps.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: main branch / root**. Done.

## ⚠️ Important notes

- All data (users, orders, services, tickets) is stored in the **browser's localStorage**. It is per-browser and per-device — a client and the admin only share data when using the same browser. This makes it perfect as a demo, prototype or front-end for a real backend.
- Payments are **simulated** — no money moves. Before selling real services, wire the checkout to a real payment processor and replace `assets/js/app.js` with API calls to a real backend, and never store plaintext passwords.
- The generated VPS details are random placeholders for demo purposes.

## Structure

```
reloaded-vps/
├── index.html
├── login.html
├── register.html
├── checkout.html
├── dashboard.html
├── admin.html
└── assets/
    ├── css/style.css   # shared design system (dark futuristic theme)
    └── js/app.js       # data layer: auth, orders, services, tickets, generators
```
