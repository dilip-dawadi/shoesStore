# ── AWS WAFv2 Web ACL ─────────────────────────────────────────────────────────
# Attaches to the Application Load Balancer (REGIONAL scope).
# Rules (evaluated in priority order):
#   1. IP reputation list  – block known malicious IPs
#   2. Rate limit          – 2 000 req / 5 min per IP (brute-force / DDoS)
#   3. Core Rule Set       – OWASP Top 10 broad protections
#   4. Known Bad Inputs    – Log4Shell, SSRF, Spring4Shell, etc.
#   5. SQL database rules  – SQL injection
#   6. PHP rules           – PHP-specific attacks
# Default action: ALLOW (all non-matching traffic passes through)

resource "aws_wafv2_web_acl" "app" {
  name        = "${var.app_name}-waf"
  description = "WAF for ${var.app_name} ALB - OWASP, rate-limit, IP reputation"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # ── 1. Amazon IP Reputation List ────────────────────────────────────────────
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 10

    override_action {
      none {} # honour the managed-rule action (BLOCK)
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  # ── 2. Rate-limit rule ───────────────────────────────────────────────────────
  # Blocks a single IP that exceeds 2 000 requests in any 5-minute window.
  rule {
    name     = "RateLimitPerIP"
    priority = 20

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit_per_5m
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # ── 3. AWS Core Rule Set (CRS) ───────────────────────────────────────────────
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        # SizeRestrictions_BODY would block JSON bodies >8 KB which breaks
        # product-image upload payloads – count instead of block.
        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-crs"
      sampled_requests_enabled   = true
    }
  }

  # ── 4. Known Bad Inputs ──────────────────────────────────────────────────────
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 40

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # ── 5. SQL database rules ────────────────────────────────────────────────────
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 50

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # ── 6. PHP application rules ─────────────────────────────────────────────────
  dynamic "rule" {
    for_each = var.waf_enable_php_rules ? [1] : []

    content {
      name     = "AWSManagedRulesPHPRuleSet"
      priority = 60

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesPHPRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.app_name}-php"
        sampled_requests_enabled   = true
      }
    }
  }

  # ── Top-level visibility ─────────────────────────────────────────────────────
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.app_name}-waf"
    sampled_requests_enabled   = true
  }

  tags = { Name = "${var.app_name}-waf" }
}

# ── Associate WAF with the ALB ────────────────────────────────────────────────

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.app.arn
  web_acl_arn  = aws_wafv2_web_acl.app.arn
}

# ── WAF Logging → CloudWatch Logs ────────────────────────────────────────────
# Log group name MUST start with "aws-waf-logs-"

resource "aws_cloudwatch_log_group" "waf" {
  count = var.enable_waf_logging ? 1 : 0

  name              = "aws-waf-logs-${var.app_name}"
  retention_in_days = var.waf_log_retention_days

  tags = { Name = "${var.app_name}-waf-logs" }
}

resource "aws_wafv2_web_acl_logging_configuration" "app" {
  count = var.enable_waf_logging ? 1 : 0

  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]
  resource_arn            = aws_wafv2_web_acl.app.arn

  # Redact sensitive headers before storing logs
  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}
