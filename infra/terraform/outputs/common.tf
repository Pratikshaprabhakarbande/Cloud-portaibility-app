# Shared output conventions (documentation reference).
# Concrete outputs live in each provider root (e.g. aws/outputs.tf).

# Example pattern:
# output "name_prefix" {
#   description = "Resource name prefix"
#   value       = "${var.project_name}-${var.environment}"
# }
