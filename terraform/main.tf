terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }

  # Optional: store state in S3 so the team shares it.
  # Uncomment and fill in after creating the bucket.
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "shoe-store/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

provider "cloudflare" {
  api_token = trimspace(var.cloudflare_api_token) != "" ? trimspace(var.cloudflare_api_token) : null
}

# ── Data sources ──────────────────────────────────────────────────────────────

# Use the existing default VPC
data "aws_vpc" "default" {
  default = true
}

# All public subnets in the default VPC
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

# ECR repository (already exists)
data "aws_ecr_repository" "app" {
  name = var.ecr_repository_name
}

# CloudWatch log group for container logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = var.app_log_retention_days
}
