# Load Testing (k6)

## Prerequisites
- k6 CLI ([install guide](https://k6.io/docs/get-started/installation/))
- Backend running (`npm run dev` or `docker compose up`) with seeded demo data

## Run

```bash
k6 run loadtest/smoke.js
# Override base URL:
k6 run -e BASE_URL=http://backend:5000/api loadtest/smoke.js
```

## Thresholds
- p95 response time < 1000ms
- Error rate < 5%

## What it tests
1. Login (obtain token)
2. Dashboard overview
3. Compliance scan (aws/CIS)
4. FinOps recommendations (aws)
5. Migration compare (aws→azure)

Ramp: 0→5→10→0 VUs over ~50s. Adjust `options.stages` for heavier loads.
