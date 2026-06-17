# Security baseline intent (IAM least-privilege, key management, guardrails).
# Placeholder — no billable resources. Provider-specific policies added later.

variable "enforce_encryption" {
  description = "Require encryption-at-rest on supported resources"
  type        = bool
  default     = true
}

variable "allowed_ssh_cidrs" {
  description = "CIDRs permitted SSH access (avoid 0.0.0.0/0)"
  type        = list(string)
  default     = []
}
