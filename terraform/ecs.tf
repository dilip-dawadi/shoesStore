# ── SSM Parameter data sources (secrets) ─────────────────────────────────────
# These must exist in SSM before running `terraform apply`.
# Create them with:
#   aws ssm put-parameter --name /shoe-store/DATABASE_URL   --type SecureString --value "postgresql://..."
#   aws ssm put-parameter --name /shoe-store/SESSION_SECRET --type SecureString --value "..."
#   aws ssm put-parameter --name /shoe-store/JWT_SECRET     --type SecureString --value "..."
#   aws ssm put-parameter --name /shoe-store/STRIPE_SECRET_KEY       --type SecureString --value "sk_live_..."
#   aws ssm put-parameter --name /shoe-store/STRIPE_WEBHOOK_SECRET   --type SecureString --value "whsec_..."

locals {
  secret_names = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "JWT_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SMTP_USER",
    "SMTP_PASS",
  ]

  alb_resource_label = "${join("/", slice(split("/", aws_lb.app.arn), 1, length(split("/", aws_lb.app.arn))))}/${join("/", concat(["targetgroup"], slice(split("/", aws_lb_target_group.app.arn), 1, length(split("/", aws_lb_target_group.app.arn)))))}"
}

data "aws_ssm_parameter" "secrets" {
  for_each = toset(local.secret_names)
  name     = "${var.ssm_prefix}/${each.key}"
}

# ── ECS Cluster ───────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = var.app_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ── Task Definition ───────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.app_name
      image     = "${data.aws_ecr_repository.app.repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      # Non-sensitive environment variables
      environment = [
        { name = "NODE_ENV", value = var.node_env },
        { name = "PORT", value = tostring(var.container_port) },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "AWS_S3_BUCKET", value = var.aws_s3_bucket },
        { name = "DB_POOL_MAX", value = var.db_pool_max },
        { name = "DB_POOL_IDLE_TIMEOUT_SECONDS", value = var.db_pool_idle_timeout_seconds },
        { name = "DB_POOL_CONNECT_TIMEOUT_SECONDS", value = var.db_pool_connect_timeout_seconds },
        { name = "SESSION_DB_POOL_MAX", value = var.session_db_pool_max },
        { name = "SESSION_DB_POOL_IDLE_TIMEOUT_MS", value = var.session_db_pool_idle_timeout_ms },
        { name = "SESSION_DB_POOL_CONNECT_TIMEOUT_MS", value = var.session_db_pool_connect_timeout_ms },
        { name = "RATE_LIMIT_WINDOW_MS", value = var.rate_limit_window_ms },
        { name = "RATE_LIMIT_MAX", value = var.rate_limit_max },
        { name = "RATE_LIMIT_CLEANUP_INTERVAL_MS", value = var.rate_limit_cleanup_interval_ms },
        { name = "RATE_LIMIT_TABLE", value = var.rate_limit_table },
        { name = "SMTP_HOST", value = var.smtp_host },
        { name = "SMTP_PORT", value = var.smtp_port },
        { name = "SMTP_SECURE", value = var.smtp_secure },
        { name = "SMTP_FROM", value = var.smtp_from },
        { name = "USE_AWS_SNS", value = var.use_aws_sns },
        { name = "FRONTEND_URL", value = var.frontend_url },
      ]

      # Sensitive values pulled from SSM Parameter Store at container start
      secrets = [
        for name in local.secret_names : {
          name      = name
          valueFrom = data.aws_ssm_parameter.secrets[name].arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ── ECS Service ───────────────────────────────────────────────────────────────

resource "aws_ecs_service" "app" {
  name                               = var.app_name
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  network_configuration {
    subnets          = data.aws_subnets.public.ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true # needed in default VPC (no NAT gateway)
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]

  lifecycle {
    ignore_changes = [desired_count] # allow manual scaling without Terraform drift
  }
}

# ── ECS Service Auto Scaling ─────────────────────────────────────────────────

resource "aws_appautoscaling_target" "ecs_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.app]
}

resource "aws_appautoscaling_policy" "ecs_alb_request_target" {
  name               = "${var.app_name}-alb-requests-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_service.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = local.alb_resource_label
    }

    target_value       = var.autoscaling_alb_request_count_target
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
  }
}
