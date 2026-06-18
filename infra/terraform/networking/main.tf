# Networking building blocks (VPC/VNet, subnets, security groups).
# Placeholder — no billable resources. Implemented per-provider as needed.

variable "cidr_block" {
  description = "Primary network CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

locals {
  subnet_count = 2
}

# Example (disabled): a provider-agnostic intent captured as locals only.
# Real VPC/subnet resources are added in the provider roots.
