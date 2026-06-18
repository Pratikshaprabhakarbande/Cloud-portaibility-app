variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "cloud-portability"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

# Free-tier guard: keep this false unless you explicitly want billable resources.
variable "enable_compute" {
  description = "Whether to create the (free-tier t2.micro) compute resource"
  type        = bool
  default     = false
}
