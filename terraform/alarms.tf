locals {
  load_balancer_dimension = join(
    "/",
    slice(split("/", aws_lb.app.arn), 1, length(split("/", aws_lb.app.arn))),
  )

  target_group_dimension = join(
    "/",
    concat(
      ["targetgroup"],
      slice(
        split("/", aws_lb_target_group.app.arn),
        1,
        length(split("/", aws_lb_target_group.app.arn)),
      ),
    ),
  )

  alarm_actions_effective = length(var.cloudwatch_alarm_actions) > 0 ? var.cloudwatch_alarm_actions : [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  alarm_name          = "${var.app_name}-alb-target-5xx-high"
  alarm_description   = "High target 5xx responses on ALB target group"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = var.alb_5xx_alarm_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = local.load_balancer_dimension
    TargetGroup  = local.target_group_dimension
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}

resource "aws_cloudwatch_metric_alarm" "alb_p95_latency" {
  alarm_name          = "${var.app_name}-alb-p95-latency-high"
  alarm_description   = "High p95 ALB target response latency"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "TargetResponseTime"
  extended_statistic  = "p95"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 3
  threshold           = var.alb_p95_latency_alarm_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = local.load_balancer_dimension
    TargetGroup  = local.target_group_dimension
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.app_name}-ecs-cpu-high"
  alarm_description   = "High ECS service CPU utilization"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = var.ecs_cpu_alarm_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.app_name}-ecs-memory-high"
  alarm_description   = "High ECS service memory utilization"
  namespace           = "AWS/ECS"
  metric_name         = "MemoryUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = var.ecs_memory_alarm_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  count = var.rds_db_instance_identifier == "" ? 0 : 1

  alarm_name          = "${var.app_name}-rds-connections-high"
  alarm_description   = "High RDS database connections"
  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = var.rds_db_connections_alarm_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.rds_db_instance_identifier
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}
