variable "vpc_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

# ─── ALB ─────────────────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name        = "videon-alb"
  description = "Public-facing ALB: accept HTTP/HTTPS from Internet"
  vpc_id      = var.vpc_id

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

  tags = { Name = "videon-alb-sg" }
}

# ─── Server EC2 ──────────────────────────────────────────────────────────────

resource "aws_security_group" "server" {
  name        = "videon-server"
  description = "Videon API server: accept traffic from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Server port from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "videon-server-sg" }
}

# ─── Client EC2 ──────────────────────────────────────────────────────────────

resource "aws_security_group" "client" {
  name        = "videon-client"
  description = "Next.js client: accept traffic from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Client port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "videon-client-sg" }
}

# ─── NATS EC2 ────────────────────────────────────────────────────────────────

resource "aws_security_group" "nats" {
  name        = "videon-nats"
  description = "NATS JetStream: accept from server only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "NATS from server"
    from_port       = 4222
    to_port         = 4222
    protocol        = "tcp"
    security_groups = [aws_security_group.server.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "videon-nats-sg" }
}

# ─── Aurora PostgreSQL ────────────────────────────────────────────────────────

resource "aws_security_group" "aurora" {
  name        = "videon-aurora"
  description = "Aurora PostgreSQL: accept from server only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.server.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "videon-aurora-sg" }
}

# ─── ElastiCache Redis ────────────────────────────────────────────────────────

resource "aws_security_group" "redis" {
  name        = "videon-redis"
  description = "ElastiCache Redis: accept from server only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from server"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.server.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "videon-redis-sg" }
}