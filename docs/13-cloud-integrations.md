# Cloud Integrations (AWS · Azure · GCP)

Live cloud integrations sit behind the existing **Cloud Adapter Layer**. Every
provider adapter serves **demo/DB data by default** and switches to **live SDK
calls only** when both conditions hold:

1. `DEMO_MODE=false`, and
2. the provider's credentials are present in the environment.

SDKs are **optional dependencies** and are **lazily imported** at call time, so:
- nothing is required when running in demo mode,
- a missing SDK or any API error **falls back to demo data** (never crashes),
- CI and local demo runs stay green with no cloud account.

## Service abstraction

```
ProviderFactory.get(scope) ─► AwsProvider / AzureProvider / GcpProvider
                                   │  (extends DbCloudProvider)
                                   ├─ live?  → await import('./awsLive.js')  → AWS SDK
                                   └─ else   → super.<method>()              → MongoDB/demo
```

Each adapter implements the common `CloudProvider` contract
(`getResources`, `getCostSummary`, `getSecurityFindings`, `getHealthScore`, …).
Live SDK code lives in dedicated `*Live.js` modules (excluded from coverage).

## AWS

| Capability | Service | Source file |
|-----------|---------|-------------|
| Resource inventory (instances + buckets) | EC2 `DescribeInstances`, S3 `ListBuckets` | `aws/awsLive.js#getResources` |
| Cost summary (month-to-date) | Cost Explorer `GetCostAndUsage` | `aws/awsLive.js#getCostSummary` |
| Security findings (open ingress) | EC2 `DescribeSecurityGroups` | `aws/awsLive.js#getSecurityFindings` |
| Monitoring (CPU series) | CloudWatch `GetMetricStatistics` | `aws/awsLive.js#getMonitoring` |

**Environment**
```
DEMO_MODE=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# optional: AWS_SESSION_TOKEN for temporary credentials
```
**IAM (least privilege, read-only):** `ec2:DescribeInstances`, `ec2:DescribeSecurityGroups`,
`s3:ListAllMyBuckets`, `ce:GetCostAndUsage`, `cloudwatch:GetMetricStatistics`.

## Azure

| Capability | Service |
|-----------|---------|
| Resource groups + resources | `@azure/arm-resources` |
| VM status | `@azure/arm-compute` |
| Monitoring | `@azure/arm-monitor` |
| Cost estimation | `@azure/arm-consumption` |

**Environment**
```
DEMO_MODE=false
AZURE_SUBSCRIPTION_ID=...
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
```
Auth uses `@azure/identity` `ClientSecretCredential`. Grant the service principal
the **Reader** + **Cost Management Reader** roles on the subscription.

## GCP

| Capability | Service |
|-----------|---------|
| Compute Engine instances | `@google-cloud/compute` |
| Storage buckets | `@google-cloud/storage` |
| Monitoring | `@google-cloud/monitoring` |
| Cost (billing) | `@google-cloud/billing` |

**Environment**
```
DEMO_MODE=false
GCP_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```
Grant the service account **Viewer** + **Billing Account Viewer**.

## Verifying live mode

`GET /api/dashboard/overview?provider=aws` returns live data when credentials are
set and `DEMO_MODE=false`; otherwise demo data. The adapter's `describe()`
reports `{ live: true|false, hasCredentials }`. All live failures are logged at
`warn` and fall back to demo automatically.

## Cost & safety

- Read-only API calls only; no resources are created or modified.
- Cost Explorer/Billing queries are month-to-date reads (negligible cost).
- Everything defaults OFF (`DEMO_MODE=true`) — zero cost unless explicitly enabled.
