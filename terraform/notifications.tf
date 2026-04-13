data "aws_caller_identity" "current" {}

resource "aws_sns_topic" "alarms" {
  name = "${var.app_name}-alarms"
}

data "aws_iam_policy_document" "alarms_topic" {
  statement {
    sid    = "AllowCloudWatchAlarmsPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["SNS:Publish"]
    resources = [aws_sns_topic.alarms.arn]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "alarms" {
  arn    = aws_sns_topic.alarms.arn
  policy = data.aws_iam_policy_document.alarms_topic.json
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count = trimspace(var.alarm_notification_email) == "" ? 0 : 1

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = trimspace(var.alarm_notification_email)
}

resource "aws_budgets_budget" "monthly_cost" {
  count = var.enable_cost_budget_alerts && trimspace(var.alarm_notification_email) != "" ? 1 : 0

  name         = trimspace(var.cost_budget_name) != "" ? trimspace(var.cost_budget_name) : "${var.app_name}-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_cost_budget_limit)
  limit_unit   = var.billing_dashboard_currency
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = var.cost_budget_alert_thresholds
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [trimspace(var.alarm_notification_email)]
    }
  }
}