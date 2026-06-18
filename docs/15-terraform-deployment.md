# Terraform Deployment (Remote State, Environments, CI)

This complements the in-app Terraform engine (`docs/07-terraform-automation.md`)
with the real IaC delivery layer: remote state, environment separation, and a
gated GitHub Actions pipeline.

## Remote state

Per-provider backend examples (copy `backend.tf.example` → `backend.tf`):

| Provider | Backend | File |
|----------|---------|------|
| AWS | S3 + DynamoDB lock | `infra/terraform/aws/backend.tf.example` |
| Azure | Azure Storage | `infra/terraform/azure/backend.tf.example` |
| GCP | GCS | `infra/terraform/gcp/backend.tf.example` |

Bootstrap the state bucket/table once (out of band), then `terraform init`.
State is encrypted; AWS uses a DynamoDB table for state locking.

## Environment separation

Per-environment variables live in `infra/terraform/environments/`:
`dev.tfvars.example`, `staging.tfvars.example`, `prod.tfvars.example`
(all ship with `enable_compute = false` so nothing is created by default).

```bash
cp infra/terraform/environments/dev.tfvars.example infra/terraform/environments/dev.tfvars
terraform -chdir=infra/terraform/aws plan -var-file=../environments/dev.tfvars
```

Isolate state per environment via distinct backend `key`/`prefix` or Terraform
workspaces.

## CI/CD pipeline — `.github/workflows/terraform.yml`

Manual `workflow_dispatch` only (never on push/PR). Inputs:
- **provider:** `aws | azure | gcp`
- **action:** `validate | plan | apply | destroy`
- **environment:** `dev | staging | prod`

Flow:
1. `terraform fmt -check` (non-blocking)
2. `init -backend=false` + `validate` (no creds required)
3. for non-validate: `init` with the remote backend
4. `plan` (plan/apply) → `apply` (apply) or `destroy`

### Required GitHub configuration
- Create **Environments** `dev`/`staging`/`prod` with **required reviewers** (so `apply`/`destroy` need human approval) and the cloud secrets:
  - AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (+ var `AWS_REGION`)
  - Azure: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
  - GCP: `GCP_CREDENTIALS_JSON`
- `validate` runs with no secrets, so it is safe to run anytime.

## Local commands

```bash
cd infra/terraform/aws
terraform init           # uses backend.tf if present
terraform validate
terraform plan  -var-file=../environments/dev.tfvars
terraform apply -var-file=../environments/dev.tfvars     # gated; enable_compute=false by default
terraform destroy -var-file=../environments/dev.tfvars
```

## Safety
- Templates default to `enable_compute = false` → free-tier-safe plans.
- `apply`/`destroy` require an environment with reviewer approval in CI.
- The in-app `/api/terraform/*` engine remains simulation-by-default and is
  independent of this CI pipeline.
