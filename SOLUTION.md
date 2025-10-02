# Frontend Engineering Challenge: Banking Data Visualization — Solution

This solution implements a robust React + TypeScript application for loading, cleaning, validating, analyzing, and visualizing the banking dataset.

Key source directories:
- App: `banking-dashboard/`
- Types: `banking-dashboard/src/types.ts`
- Parsing: `banking-dashboard/src/utils/parsing.ts`
- Validation: `banking-dashboard/src/utils/validation.ts`
- Analytics: `banking-dashboard/src/utils/analytics.ts`
- UI Components: `banking-dashboard/src/components/`

How to run:
- See `banking-dashboard/README.md` for quick start.

---

## Part 1: Foundational Implementation and Data Integrity (45 points)

### Question 1: Data Normalization and Type Conversion (15 points)
Implemented in `banking-dashboard/src/utils/parsing.ts`.

- `parseAmount(amount: string): number`
  - Handles values like `$1,234.56`, `1,234.56`, `1234.56`, `N/A`, empty, and `null`.
  - Removes currency symbols and commas via regex `[^0-9.-]+` and converts to number, returns `NaN` on invalid.

- `normalizeGender(gender: string): 'Male' | 'Female' | 'Other'`
  - Maps common inputs: `M`, `male`, `FEMALE`, `f` to canonical values.
  - Returns `Other` for blanks or non-standard entries (e.g., `Non-binary`).

- `parseDate(dateString: string): Date | null`
  - Supports natural parsing via `Date.parse` for ISO-like formats (`YYYY-MM-DD`).
  - Explicitly supports `MM/DD/YYYY` and `YYYY/MM/DD` patterns.
  - Returns `null` if unparsable.

Additional helper:
- `normalizeTransactionType()` to standardize transaction types to a small union (`Deposit`, `Withdrawal`, `Transfer`, `Payment`, `Fee`, `Other`).


### Question 2: Data Validation and Filtering (20 points)
Implemented in `banking-dashboard/src/utils/validation.ts`:

- `rowToCleaned(row, rowIndex)` converts a raw CSV row to `CleanedTransaction` with:
  - Required: `customerId`, `transactionDate`, `transactionAmount`.
  - Aliases supported: `Customer ID`/`CustomerID`, `Branch ID`/`Branch Code`, `TransactionID`/`Transaction Id`/`TxnID`, `Account Balance After Transaction`/`Account Balance`, `Date Of Account Opening`/`Account Opening Date`.
  - Normalization: gender, transaction type, numeric parsing, date parsing.

- `validateAndClean(rows)` returns `{ clean, errors }`:
  - **Deposit positivity**: Deposits must be > 0; invalid rows dropped.
  - **Balance logic**: If a previous balance exists for a customer, checks the next balance after a transaction using a tolerance `EPS = 0.01`. On mismatch, logs a validation error but keeps the record (so we can visualize anomalies) and advances the chain.
  - **Age range**: Drops records where age is outside `[18,120]`.
  - **Age consistency**: For a customer, if subsequent rows have a different age, logs an error and nulls out the age value of the inconsistent row (keeps row for analysis).
  - **Duplicates**: Deduplicates by `TransactionID` when available, else uses a composite key of `customerId|date|type|amount|branch`.
  - Sorts cleaned output by `customerId` then `transactionDate`.

Filtering criteria explained:
- Drop if required fields missing or deposit non-positive or age out-of-range.
- Keep but flag if age inconsistent or balance mismatch (to preserve signals for anomaly views).
- Drop duplicates (strict).


### Question 3: Edge Case Management (10 points)
Strategy and code locations:

- **Different ages for same customer**
  - `validation.ts`: Maintain `ageByCustomer`. If an age conflicts, push a `ValidationError`. Keep the row but set `age` to `undefined` to avoid contaminating segments.

- **Balance does not reconcile**
  - `validation.ts`: Maintain `lastBalanceByCustomer`. Compute expected balance for deposit/withdrawal/payment/fee (transfer skipped due to unknown direction). If mismatch beyond epsilon, log an error and proceed. This keeps both integrity tracking and anomaly signals.

- **Duplicate transaction records**
  - `validation.ts`: Track dedup keys (`TransactionID` preferred). Duplicates are filtered out and logged as errors.


## Part 2: Business Logic & Scalable Analysis (40 points)

### Question 4: Business Insights and Aggregation (25 points)
Implemented in `banking-dashboard/src/utils/analytics.ts`:

- `getMonthlyVolumeByBranch(data: CleanedTransaction[]): Map<string, Map<string, number>>`
  - Returns total absolute transaction volume by `branchId` and `yyyy-MM` month.

- `detectAnomalousTransactions(data: CleanedTransaction[]): CleanedTransaction[]`
  - Per-customer z-score detection on absolute transaction amounts. Marks transactions with `z >= 3` as anomalous.

- `calculateCustomerLTV(customerId, data, opts?)`
  - Simplified model:
    - Fee revenue: 0.1% for deposits/withdrawals, 0.05% for transfers (configurable).
    - Balance margin: 10 bps/month on last monthly `accountBalanceAfter` snapshot (when available).
  - Returns a numeric LTV estimate.


### Question 5: Strategic Data Aggregation (15 points)
Approach and metrics:

- **Underperforming branches**
  - Metrics: Total volume, number of transactions, average ticket size, active customers, growth vs previous period, complaints per 1k transactions (if available), net inflow (deposits - withdrawals), and anomaly rate.
  - Method: Aggregate by branch per month. Compute rolling 3–6-month averages and ranks. Flag branches below P25 on multiple KPIs.

- **High-Value Customer segments**
  - Segmentation: By LTV quantiles (top decile), by average balance, by transaction frequency and total volume. Optionally stratify by account type.
  - Method: Compute LTV per customer, bin into quantiles, then group by demographic/account attributes.

- **Seasonal trends**
  - Method: Aggregate monthly totals across years (`yyyy-MM`) and compare YoY. Compute month-of-year averages to reveal seasonality. Decompose trend vs season with moving averages.
  - Visualizations: Line chart of monthly totals; heatmap of month (x) vs branch (y); YoY overlay lines.


## Part 3: Performance, Visualization & Architecture (45 points)

### Question 6: Performance Optimization for Large Datasets (15 points)
Assuming 10M transactions:

- **Bottlenecks**
  - Browser memory pressure from loading entire CSV.
  - Synchronous parsing/validation on main thread causing UI jank.
  - Large JS objects and Maps increasing GC overhead.

- **Optimizations**
  - Streaming CSV with Papa Parse in chunk mode and backpressure; process in Web Workers to keep UI responsive.
  - Use typed arrays or compact row objects; avoid attaching `raw` rows in production mode.
  - Pre-bucket aggregations during streaming (e.g., month+branch) to avoid storing all rows.
  - Use incremental rolling stats for anomaly detection (Welford’s algorithm) instead of storing all amounts.
  - Persist intermediate aggregates to IndexedDB for pagination/virtualization.

- **Memory constraints**
  - Process in chunks (e.g., 100k) and keep only aggregates; discard raw records unless needed for drill-down.
  - Offer server-side preprocessing for very large datasets (Node/worker service) and stream aggregated results to the browser.


### Question 7: Visualization and Reporting (20 points)
Five key visualizations and prep:

1) Branch Performance Dashboard
- Chart: Horizontal bar
- X: Total volume; Y: Branch
- Aggregation: Sum(|amount|) per branch
- Insight: Top/bottom performing branches
- Code: `TopBranchesChart` uses in-file aggregation on `branchId`.

2) Monthly Transaction Volume by Branch
- Chart: Stacked bar by branch over months
- X: `yyyy-MM`; Y: Volume
- Aggregation: `getMonthlyVolumeByBranch`
- Insight: Comparative trends and branch seasonality

3) Seasonal Trends (Global)
- Chart: Line
- X: `yyyy-MM`; Y: Total volume
- Aggregation: Sum across all branches by month
- Insight: Seasonality and growth

4) Customer LTV Ranking
- Chart: Vertical bar
- X: Customer ID; Y: Estimated LTV
- Aggregation: `calculateCustomerLTV`
- Insight: High-value customers

5) Anomalous Transactions Table
- Chart: Tabular list (top 100)
- Columns: Customer, Date, Type, Amount, Branch
- Aggregation: `detectAnomalousTransactions(z>=3)`
- Insight: Outlier detection for review


### Question 8: Real-Time Data Architecture (10 points)
Challenges and design:

- **Limitations of static CSV**
  - No incremental updates; entire file reload needed.
  - Expensive re-computation; cannot sustain near real-time insights.

- **High-level real-time design**
  - Event ingestion: Kafka/PubSub/Kinesis for transaction events.
  - Stream processing: Flink/Kafka Streams/Spark Structured Streaming for cleaning, validation, and incremental aggregates (branch-month volume, per-customer stats, anomaly scoring).
  - Storage: Columnar OLAP (ClickHouse/Pinot/BigQuery) for fast aggregations; Redis for hot aggregates; S3 for cold storage.
  - API: GraphQL/REST service exposing pre-aggregated metrics and drill-down endpoints.
  - Frontend: WebSocket/SSE to subscribe to updates; UI state updates via reducers with windowed aggregations.

- **Code changes needed**
  - Convert `validateAndClean` to operate on streaming events (one-by-one) and maintain in-memory/stateful aggregates (age map, last balance map) server-side.
  - Change interfaces to accept event payloads and produce incremental diffs.
  - The UI components can consume aggregate endpoints (e.g., `/metrics/branch-month`) and re-render on pushes.

---

## Testing Strategy

- **Unit tests** (e.g., Vitest/Jest):
  - `parsing.ts`: Amount parsing, gender normalization, date parsing for multiple formats and edge cases.
  - `validation.ts`: Deposit positivity, balance reconciliation with tolerance, age range, age consistency, duplicate detection.
  - `analytics.ts`: Monthly aggregation structure, anomaly detection thresholds, LTV arithmetic with options.

- **Property-based tests** for numeric tolerance and streaming accumulation (Welford’s algorithm if added).

- **Performance tests**: Benchmark chunked parsing and worker-based validation with synthetic large datasets.

- **UI tests**: File upload flow, error list rendering, charts render with sample datasets, filters.

- **Manual QA**: Upload provided CSV and visually inspect KPIs for plausible distributions.

---

## Business Context Notes

- Deposit positivity and reconciliation protect against operational data entry errors.
- Age consistency ensures regulatory and KYC reliability in customer attributes.
- Branch-level KPIs (volume, active customers, net flows) drive resource allocation and performance management.
- LTV approximations give a quick heuristic for segmenting customers for retention or cross-sell campaigns.
