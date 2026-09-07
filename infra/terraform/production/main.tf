# ─── Networking ───────────────────────────────────────────────────────────────

module "vpc" {
  source = "../modules/vpc"
  name   = local.name
  cidr   = var.vpc_cidr
  azs    = var.azs
}

module "security" {
  source   = "../modules/security"
  vpc_id   = module.vpc.vpc_id
  vpc_cidr = var.vpc_cidr
}

# ─── Peering to motionmesh (shared NATS + Redis) ─────────────────────────────

resource "aws_vpc_peering_connection" "videon_motionmesh" {
  vpc_id      = module.vpc.vpc_id
  peer_vpc_id = var.motionmesh_vpc_id
  auto_accept = true

  tags = {
    Name = "videon-prod-to-motionmesh-prod"
  }
}

resource "aws_route" "videon_private_to_motionmesh" {
  route_table_id         = module.vpc.private_route_table_id
  destination_cidr_block = var.motionmesh_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.videon_motionmesh.id
}

resource "aws_route" "videon_public_to_motionmesh" {
  route_table_id         = module.vpc.public_route_table_id
  destination_cidr_block = var.motionmesh_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.videon_motionmesh.id
}

# ─── Data stores ─────────────────────────────────────────────────────────────

module "s3" {
  source               = "../modules/s3"
  bucket_name          = local.s3_bucket_name
  cors_allowed_origins = local.cors_allowed_origins
}

module "iam" {
  source     = "../modules/iam"
  bucket_arn = module.s3.bucket_arn
}

module "aurora" {
  source            = "../modules/aurora"
  name              = local.name
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnet_ids
  security_group_id = module.security.aurora_sg_id
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  instance_class    = var.aurora_instance_class
}

# ─── Dedicated S3 service user ────────────────────────────────────────────────
# The videon server signs S3 requests with explicit credentials (no instance
# role), so it gets a dedicated user scoped to the videon bucket.

resource "aws_iam_user" "server_s3" {
  name = "videon-server-s3"
}

resource "aws_iam_user_policy" "server_s3" {
  name = "videon-server-s3"
  user = aws_iam_user.server_s3.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject",
        "s3:GetObjectAttributes",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ]
      Resource = [module.s3.bucket_arn, "${module.s3.bucket_arn}/*"]
    }]
  })
}

resource "aws_iam_access_key" "server_s3" {
  user = aws_iam_user.server_s3.name
}

# ─── TLS ──────────────────────────────────────────────────────────────────────

resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ─── Load balancer ────────────────────────────────────────────────────────────

module "alb" {
  source                = "../modules/alb"
  name                  = local.name
  vpc_id                = module.vpc.vpc_id
  public_subnets        = module.vpc.public_subnet_ids
  security_group_id     = module.security.alb_sg_id
  certificate_arn       = aws_acm_certificate_validation.main.certificate_arn
  api_target_port       = 8000
  api_health_path       = "/api/v1/health"
  dashboard_target_port = 3000
  domain_name           = var.domain_name
  api_domain            = var.api_domain
}

# ─── Compute ──────────────────────────────────────────────────────────────────

module "server" {
  source                = "../modules/ec2-service"
  name                  = "videon-server"
  subnet_id             = module.vpc.private_subnet_ids[1]
  security_group_ids    = [module.security.server_sg_id]
  instance_profile_name = module.iam.instance_profile_name
  instance_type         = var.api_instance_type
  key_name              = var.key_name
  user_data             = base64encode(templatefile("${path.module}/user-data/server.sh.tftpl", {
    github_repository              = var.github_repository
    github_branch                  = var.github_branch
    motionmesh_repository          = var.motionmesh_repository
    aws_region                     = var.aws_region
    database_url                   = local.database_url
    redis_url                      = local.redis_url
    nats_url                       = local.nats_url
    storage_bucket                 = local.s3_bucket_name
    clerk_secret_key               = var.clerk_secret_key
    redis_key_secret               = var.redis_key_secret
    analytics_jwt_secret           = var.analytics_jwt_secret
    motionmesh_api_key             = var.motionmesh_api_key
    motionmesh_bucket_id           = var.motionmesh_bucket_id
    motionmesh_transcode_bucket_id = var.motionmesh_transcode_bucket_id
    motionmesh_base_url            = var.motionmesh_base_url
    stripe_secret_key              = var.stripe_secret_key
    stripe_webhook_secret          = var.stripe_webhook_secret
    stripe_price_starter           = var.stripe_price_starter
    stripe_price_pro               = var.stripe_price_pro
    stripe_price_business          = var.stripe_price_business
    frontend_url                   = local.frontend_url
    s3_access_key_id               = aws_iam_access_key.server_s3.id
    s3_access_key_secret           = aws_iam_access_key.server_s3.secret
  }))
  target_group_arn = module.alb.api_target_group_arn
  attach_to_alb    = true
}

module "client" {
  source                = "../modules/ec2-service"
  name                  = "videon-client"
  subnet_id             = module.vpc.private_subnet_ids[1]
  security_group_ids    = [module.security.client_sg_id]
  instance_profile_name = module.iam.instance_profile_name
  instance_type         = var.client_instance_type
  key_name              = var.key_name
  user_data             = base64encode(templatefile("${path.module}/user-data/client.sh.tftpl", {
    github_repository      = var.github_repository
    github_branch          = var.github_branch
    aws_region             = var.aws_region
    next_public_server_uri = local.public_api_url
    clerk_publishable_key  = var.clerk_publishable_key
    clerk_secret_key       = var.clerk_secret_key
    videon_api_key         = var.videon_api_key
    videon_base_url        = "https://${var.api_domain}"
  }))
  target_group_arn = module.alb.dashboard_target_group_arn
  attach_to_alb    = true
}

# ─── DNS ──────────────────────────────────────────────────────────────────────

resource "aws_route53_record" "videon" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.api_domain
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = false
  }
}

# ─── Observability ────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api" {
  name              = "/videon/api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "client" {
  name              = "/videon/client"
  retention_in_days = 14
}