# ============================================================
# AWS root module (Phase 2 scaffolding)
# No billable resources are defined yet. Real, free-tier-friendly
# resources (VPC, t2.micro, S3) are added in Phase 8.
# ============================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Example placeholder — gated off by default to avoid any charges.
# resource "aws_instance" "app" {
#   count         = var.enable_compute ? 1 : 0
#   ami           = data.aws_ami.al2.id
#   instance_type = "t2.micro" # free tier
#   tags          = merge(local.common_tags, { Name = "${local.name_prefix}-app" })
# }
