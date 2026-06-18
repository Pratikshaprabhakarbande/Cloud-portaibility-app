# environments/

Per-environment variable files. Copy an example and pass it to terraform:

```bash
cp dev.tfvars.example dev.tfvars
terraform -chdir=../aws plan -var-file=../environments/dev.tfvars
```

All examples keep `enable_compute = false` so plans create nothing by default.
