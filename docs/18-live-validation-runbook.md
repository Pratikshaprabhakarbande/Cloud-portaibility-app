# Live Cloud Validation Runbook

No cloud credentials are present in this environment. Follow the steps below to
validate the live adapters against real accounts.

## Prerequisites
- `DEMO_MODE=false` in `backend/.env`
- Backend running (`npm run dev` or via compose)
- Seeded demo data (`npm run seed`) for baseline comparison

## AWS

```bash
# 1. Set env
export AWS_ACCESS_KEY_ID=<your_key>
export AWS_SECRET_ACCESS_KEY=<your_secret>
export AWS_REGION=us-east-1

# 2. Install optional deps (if not already)
cd backend && npm install @aws-sdk/client-ec2 @aws-sdk/client-s3 @aws-sdk/client-cost-explorer @aws-sdk/client-cloudwatch

# 3. Smoke test (expect real instances/buckets in the response)
curl -s http://localhost:5000/api/dashboard/overview?provider=aws \
  -H "Authorization: Bearer <token>" | jq '.data.providers[0]'

# Expected: "source": "aws-sdk" in resource items; real instance IDs / bucket names.
```

**IAM (read-only):** `ec2:DescribeInstances`, `ec2:DescribeSecurityGroups`,
`s3:ListAllMyBuckets`, `ce:GetCostAndUsage`, `cloudwatch:GetMetricStatistics`.

## Azure

```bash
export AZURE_SUBSCRIPTION_ID=<sub_id>
export AZURE_TENANT_ID=<tenant>
export AZURE_CLIENT_ID=<app_id>
export AZURE_CLIENT_SECRET=<secret>

cd backend && npm install @azure/identity @azure/arm-resources @azure/arm-compute @azure/arm-consumption @azure/arm-network

curl -s http://localhost:5000/api/dashboard/overview?provider=azure \
  -H "Authorization: Bearer <token>" | jq '.data.providers[0]'
```

**SP roles:** Reader + Cost Management Reader on the subscription.

## GCP

```bash
export GCP_PROJECT_ID=<project_id>
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa-key.json

cd backend && npm install @google-cloud/compute @google-cloud/storage

curl -s http://localhost:5000/api/dashboard/overview?provider=gcp \
  -H "Authorization: Bearer <token>" | jq '.data.providers[0]'
```

**SA roles:** Viewer + Billing Account Viewer.

## Expected behavior
- Live adapters respond with real resource IDs, instance names, cost figures.
- If credentials are invalid or SDKs fail, the adapter logs a `warn` and returns
  the demo/DB-backed data (graceful fallback) — the API never crashes or errors to the client.

## Verifying fallback
Remove one credential and repeat. The response should still return 200 with
demo data (check `source` field or resource names for demo identifiers).

## Multi-cloud
```bash
curl -s http://localhost:5000/api/dashboard/overview?provider=multi-cloud \
  -H "Authorization: Bearer <token>" | jq '.data.providers[] | { key, source: (.items[0].source // "demo") }'
```
