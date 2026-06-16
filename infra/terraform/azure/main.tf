# ============================================================
# Azure root module (Phase 2 scaffolding — implemented in Phase 8)
# ============================================================
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "cloud-portability"
}

# Placeholder — no billable resources defined yet.
