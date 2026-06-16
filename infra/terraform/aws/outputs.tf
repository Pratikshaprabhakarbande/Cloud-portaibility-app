output "name_prefix" {
  description = "Resource name prefix used by this module"
  value       = local.name_prefix
}

output "region" {
  description = "AWS region in use"
  value       = var.aws_region
}
