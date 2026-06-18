# terraform/

Infrastructure-as-Code, **AWS-first**. Each provider directory is an
independent root module. Shared, reusable building blocks live in `modules/`.

```
terraform/
├── aws/        # AWS root module (implemented first — free-tier friendly)
├── azure/      # Azure root module
├── gcp/        # GCP root module
└── modules/
    ├── network/   # VPC/VNet/network primitives
    └── compute/   # small/free-tier compute resources
```

> Implementation lands in **Phase 8 (Terraform Integration)**. This phase only
> creates the structure and placeholder `*.tf` files with variables/outputs.

## Cost note
All examples target **free-tier / smallest** SKUs and default to `count = 0` or
disabled resources, so `terraform plan` is safe and creates nothing by accident.
