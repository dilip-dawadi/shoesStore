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

variable "smtp_secure" {
  type    = string
  default = "false"
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

variable "db_pool_max" {
  description = "Max DB connections per app task for postgres-js"
  type        = string
  default     = "8"
}

variable "db_pool_idle_timeout_seconds" {
  description = "Idle timeout in seconds for postgres-js pool"
  type        = string
  default     = "30"
}

variable "db_pool_connect_timeout_seconds" {
  description = "Connect timeout in seconds for postgres-js pool"
  type        = string
  default     = "30"
}

variable "session_db_pool_max" {
  description = "Max DB connections for session/rate-limit pg pool"
  type        = string
  default     = "4"
}

variable "session_db_pool_idle_timeout_ms" {
  description = "Idle timeout in ms for session/rate-limit pg pool"
  type        = string
  default     = "30000"
}

variable "session_db_pool_connect_timeout_ms" {
  description = "Connect timeout in ms for session/rate-limit pg pool"
  type        = string
  default     = "5000"
}

variable "rate_limit_window_ms" {
  description = "Rate-limit window duration in milliseconds"
  type        = string
  default     = "900000"
}

variable "rate_limit_max" {
  description = "Max requests per rate-limit window"
  type        = string
  default     = "500"
}

variable "rate_limit_cleanup_interval_ms" {
  description = "Cleanup interval for expired rate-limit rows"
  type        = string
  default     = "600000"
}

variable "rate_limit_table" {
  description = "Postgres table used by shared rate limiter"
  type        = string
  default     = "rate_limit_hits"
}

# ── ECS Service Auto Scaling ─────────────────────────────────────────────────

variable "autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 4
}

variable "autoscaling_cpu_target" {
  description = "Target average CPU utilization percentage for ECS service"
  type        = number
  default     = 65
}

variable "autoscaling_memory_target" {
  description = "Target average memory utilization percentage for ECS service"
  type        = number
  default     = 75
}

variable "autoscaling_alb_request_count_target" {
  description = "Target ALB request count per target"
  type        = number
  default     = 1000
}

variable "autoscaling_scale_in_cooldown" {
  description = "Cooldown in seconds after a scale-in activity"
  type        = number
  default     = 180
}

variable "autoscaling_scale_out_cooldown" {
  description = "Cooldown in seconds after a scale-out activity"
  type        = number
  default     = 60
}
