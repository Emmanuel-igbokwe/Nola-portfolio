# FoodPulse — Global Harvest Foods

Built by Emmanuel Igbokwe.

A real-time financial & business intelligence dashboard for a fictional global
food company (Global Harvest Foods), built as a portfolio piece demonstrating
FP&A, financial analysis, and data visualization skills. All data is
synthetic and generated client-side — no backend or external APIs required.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In `vite.config.js`, set `base: "/your-repo-name/"` (match your repo's
   exact name).
3. Install the deploy helper and ship it:

   ```bash
   npm install
   npm run deploy
   ```

   This builds the app and pushes `dist/` to a `gh-pages` branch.
4. In your repo's Settings → Pages, set the source to the `gh-pages` branch.
   Your dashboard will be live at `https://<username>.github.io/<repo-name>/`.

## What's inside

- **Core dashboards:** Executive KPIs, Product Profitability Matrix,
  Geographic Performance, Budget vs. Actual, Commodity Risk Monitor,
  Forecast Scenarios, Alerts & Business Health Score.
- **Advanced modules:** Decision Simulator, Customer Analytics, Product
  Intelligence (ABC/lifecycle/mix), Pricing & Break-Even, Working Capital &
  13-week Cash Flow, Risk Heatmap & Performance Scorecard, Marketing ROI,
  Management Action Center, Month-End Close tracker, and a printable CFO
  Summary.
- Global filters (period / segment / region) wired into the core views.

## Tech

React 18 + Vite, Tailwind CSS, Recharts, lucide-react. Single-page app,
all data generated deterministically in `src/App.jsx` — no database, no API
keys, nothing to configure.
