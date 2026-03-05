variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name — used to name all resources"
  type        = string
  default     = "shoe-store"
}

variable "ecr_repository_name" {
  description = "ECR repository name (must already exist)"
  type        = string
  default     = "shoe-store"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Port the Express server listens on inside the container"
  type        = number
  default     = 5000
}

variable "cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of running task instances"
  type        = number
  default     = 1
}

# ── Secrets stored in SSM Parameter Store ─────────────────────────────────────
# Create these with:
#   aws ssm put-parameter --name /shoe-store/DATABASE_URL --type SecureString --value "..."

variable "ssm_prefix" {
  description = "SSM parameter path prefix"
  type        = string
  default     = "/shoe-store"
}

# ── Non-sensitive env vars passed directly ────────────────────────────────────

variable "node_env" {
  type    = string
  default = "production"
}

variable "aws_s3_bucket" {
  description = "S3 bucket name for product images"
  type        = string
  default     = "shoes-store-images"
}

variable "smtp_host" {
  type    = string
  default = "smtp.gmail.com"
}

variable "smtp_port" {
  type    = string
  default = "587"
}

variable "smtp_from" {
  type    = string
  default = "noreply@shoesstore.com"
}

variable "use_aws_sns" {
  type    = string
  default = "false"
}

variable "frontend_url" {
  description = "Public URL of the frontend (used in email links)"
  type        = string
  default     = ""
}
