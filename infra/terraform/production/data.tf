data "aws_caller_identity" "current" {}

# videon.motionmesh.co.in is a subdomain — records are created in the
# motionmesh.co.in hosted zone (which is the caller's own zone).
data "aws_route53_zone" "primary" {
  name         = var.zone_name
  private_zone = false
}