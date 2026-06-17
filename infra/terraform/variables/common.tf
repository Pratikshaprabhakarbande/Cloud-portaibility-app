# Shared variable declarations reused across provider roots/modules.
# No resources are declared here.

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "cloud-portability"
}

variable "environment" {
  description = "Deployment environment (dev|staging|prod)"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner/team tag applied to resources"
  type        = string
  default     = "platform"
}

# Free-tier guard: keep false unless billable resources are explicitly wanted.
variable "enable_compute" {
  description = "Whether to create (free-tier) compute resources"
  type        = bool
  default     = false
}
