# ── RDS Security Group Rule ───────────────────────────────────────────────────
# Allow Fargate tasks to reach the existing RDS instance on port 5432.
# The RDS SG (sg-0297fd07bf25e48ad) was created outside Terraform so we
# just add the inbound rule without managing the whole SG.
resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = "sg-0297fd07bf25e48ad" # RDS security group
  source_security_group_id = aws_security_group.ecs.id
  description              = "Allow ECS Fargate to connect to RDS PostgreSQL"
}

# ── ALB Security Group ────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb"
  description = "Allow HTTP/HTTPS inbound from the internet"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-alb" }
}

# ── ECS Task Security Group ───────────────────────────────────────────────────
resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs"
  description = "Allow traffic only from the ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "From ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-ecs" }
}
