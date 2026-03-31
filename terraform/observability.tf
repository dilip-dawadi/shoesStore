locals {
  operations_dashboard_name_effective = trimspace(var.operations_dashboard_name) != "" ? trimspace(var.operations_dashboard_name) : "${var.app_name}-operations"

  synthetics_canary_name = "${var.app_name}-health"

  synthetics_healthcheck_url = trimsuffix(
    trimspace(var.synthetics_healthcheck_url) != "" ? trimspace(var.synthetics_healthcheck_url) : "http://${aws_lb.app.dns_name}/health",
    "/",
  )

  operations_dashboard_alarm_arns = concat(
    [
      aws_cloudwatch_metric_alarm.alb_target_5xx.arn,
      aws_cloudwatch_metric_alarm.alb_p95_latency.arn,
      aws_cloudwatch_metric_alarm.ecs_cpu_high.arn,
      aws_cloudwatch_metric_alarm.ecs_memory_high.arn,
      aws_cloudwatch_metric_alarm.synthetics_success_percent_low.arn,
    ],
    aws_cloudwatch_metric_alarm.rds_connections_high[*].arn,
  )
}

data "archive_file" "synthetics_canary" {
  type        = "zip"
  output_path = "${path.module}/.terraform/${local.synthetics_canary_name}.zip"

  source {
    filename = "index.js"
    content  = <<-EOF
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const checkHealth = async function () {
  const page = await synthetics.getPage();
  const url = process.env.HEALTHCHECK_URL;

  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  if (!response) {
    throw new Error(`No response returned from $${url}`);
  }

  const status = response.status();
  log.info(`Healthcheck status: $${status}`);

  if (status < 200 || status >= 300) {
    throw new Error(`Healthcheck failed with status $${status}`);
  }
};

exports.handler = async () => {
  return await checkHealth();
};
EOF
  }
}

resource "aws_s3_bucket" "synthetics_artifacts" {
  bucket = "${var.app_name}-synthetics-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
}

resource "aws_s3_bucket_public_access_block" "synthetics_artifacts" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "synthetics_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["synthetics.amazonaws.com", "lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "synthetics_canary" {
  name               = "${var.app_name}-synthetics-role"
  assume_role_policy = data.aws_iam_policy_document.synthetics_assume_role.json
}

data "aws_iam_policy_document" "synthetics_execution" {
  statement {
    sid = "S3ArtifactsWrite"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [
      aws_s3_bucket.synthetics_artifacts.arn,
      "${aws_s3_bucket.synthetics_artifacts.arn}/*",
    ]
  }

  statement {
    sid       = "CloudWatchMetrics"
    actions   = ["cloudwatch:PutMetricData"]
    resources = ["*"]
  }

  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid = "XRayWrite"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "synthetics_execution" {
  name   = "${var.app_name}-synthetics-execution"
  role   = aws_iam_role.synthetics_canary.id
  policy = data.aws_iam_policy_document.synthetics_execution.json
}

resource "aws_synthetics_canary" "health" {
  name                 = local.synthetics_canary_name
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.id}/canary/"
  execution_role_arn   = aws_iam_role.synthetics_canary.arn
  handler              = "index.handler"
  runtime_version      = var.synthetics_canary_runtime_version
  start_canary         = true
  zip_file             = data.archive_file.synthetics_canary.output_path

  schedule {
    expression = var.synthetics_canary_schedule_expression
  }

  run_config {
    timeout_in_seconds = var.synthetics_canary_timeout_seconds
    environment_variables = {
      HEALTHCHECK_URL = local.synthetics_healthcheck_url
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  depends_on = [aws_iam_role_policy.synthetics_execution]
}

resource "aws_cloudwatch_metric_alarm" "synthetics_success_percent_low" {
  alarm_name          = "${var.app_name}-synthetics-success-low"
  alarm_description   = "Synthetics canary success percent dropped below threshold"
  namespace           = "CloudWatchSynthetics"
  metric_name         = "SuccessPercent"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = var.synthetics_success_percent_alarm_threshold
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"

  dimensions = {
    CanaryName = aws_synthetics_canary.health.name
  }

  alarm_actions = local.alarm_actions_effective
  ok_actions    = local.alarm_actions_effective
}

resource "aws_cloudwatch_dashboard" "operations" {
  dashboard_name = local.operations_dashboard_name_effective

  dashboard_body = jsonencode({
    widgets = concat(
      [
        {
          type   = "alarm"
          x      = 0
          y      = 0
          width  = 24
          height = 6
          properties = {
            title  = "${var.app_name} Alarm Status"
            alarms = local.operations_dashboard_alarm_arns
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 6
          width  = 12
          height = 6
          properties = {
            title   = "ALB Target 5XX"
            region  = var.aws_region
            stat    = "Sum"
            period  = 60
            view    = "timeSeries"
            metrics = [["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", local.load_balancer_dimension, "TargetGroup", local.target_group_dimension]]
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 6
          width  = 12
          height = 6
          properties = {
            title   = "ALB p95 Latency"
            region  = var.aws_region
            stat    = "p95"
            period  = 60
            view    = "timeSeries"
            metrics = [["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", local.load_balancer_dimension, "TargetGroup", local.target_group_dimension]]
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "ECS CPU and Memory"
            region = var.aws_region
            period = 60
            view   = "timeSeries"
            metrics = [
              ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name],
              ["AWS/ECS", "MemoryUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name],
            ]
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "Synthetics SuccessPercent"
            region = var.aws_region
            stat   = "Average"
            period = 60
            view   = "timeSeries"
            metrics = [
              ["CloudWatchSynthetics", "SuccessPercent", "CanaryName", aws_synthetics_canary.health.name],
              ["CloudWatchSynthetics", "Duration", "CanaryName", aws_synthetics_canary.health.name, { yAxis = "right" }],
            ]
          }
        },
      ],
      var.rds_db_instance_identifier == "" ? [] : [
        {
          type   = "metric"
          x      = 0
          y      = 18
          width  = 24
          height = 6
          properties = {
            title   = "RDS Database Connections"
            region  = var.aws_region
            stat    = "Maximum"
            period  = 60
            view    = "timeSeries"
            metrics = [["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_db_instance_identifier]]
          }
        },
      ],
    )
  })
}
