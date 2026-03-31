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