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
        { name = "NODE_ENV",      value = var.node_env },
        { name = "PORT",          value = tostring(var.container_port) },
        { name = "AWS_REGION",    value = var.aws_region },
        { name = "AWS_S3_BUCKET", value = var.aws_s3_bucket },
        { name = "SMTP_HOST",     value = var.smtp_host },
        { name = "SMTP_PORT",     value = var.smtp_port },
        { name = "SMTP_FROM",     value = var.smtp_from },
        { name = "USE_AWS_SNS",   value = var.use_aws_sns },
        { name = "FRONTEND_URL",   value = var.frontend_url },
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
