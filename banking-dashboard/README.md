# Banking Dashboard (React + TypeScript + Vite)

A performant, modular frontend that loads a CSV of banking transactions, cleans and validates the data, runs business analytics, and renders key visualizations.

- Clean/normalize: `src/utils/parsing.ts`
- Validate/filter: `src/utils/validation.ts`
- Analytics: `src/utils/analytics.ts`
- Types: `src/types.ts`
- UI: `src/components/*` and `src/App.tsx`

## Prerequisites
- Node.js 18+ and npm

## Install
```bash
npm install
```

## Run (development)
```bash
npm run dev
```
Then open the printed local URL (e.g., http://localhost:5173).

## Usage
1. Click "Choose file" and select the CSV (e.g., `data/Comprehensive_Banking_Database.csv`).
2. The app will parse, clean, and validate the data.
3. Explore:
   - Monthly volume by branch
   - Seasonal trends
   - Top branches by volume
   - Estimated customer LTV (top 20)
   - Anomalous transactions (z-score based)

## Notes
- Large datasets: Parsing/validation is implemented to run in the browser. For 10M+ rows, consider streaming+workers or server-side pre-aggregation.
- See root `SOLUTION.md` for detailed answers to the assessment questions, assumptions, and testing strategy.
