output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "server_sg_id" {
  value = aws_security_group.server.id
}

output "client_sg_id" {
  value = aws_security_group.client.id
}

output "nats_sg_id" {
  value = aws_security_group.nats.id
}

output "aurora_sg_id" {
  value = aws_security_group.aurora.id
}

output "redis_sg_id" {
  value = aws_security_group.redis.id
}