variable "project" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_gateway_url" {
  description = "API Gateway URL for face liveness sessions"
  type        = string
}

variable "api_key" {
  description = "API Key for face liveness service"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}

resource "aws_lightsail_instance" "face_liveness_relay" {
  name              = "${var.project}-face-liveness-relay"
  availability_zone = "us-east-1a"
  blueprint_id      = "ubuntu_24_04"
  bundle_id         = "small_2_0"

  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker

    mkdir -p /app/relay
    cd /app/relay

    apt-get install -y awscli
    aws s3 cp s3://${aws_s3_bucket.relay_bucket.id}/relay-service.tar.gz /tmp/relay-service.tar.gz
    tar -xzf /tmp/relay-service.tar.gz -C /app/relay

    cd /app/relay
    docker build -t face-liveness-relay .
    docker run -d --name face-liveness-relay -p 8080:8080 -e API_GATEWAY_URL="${var.api_gateway_url}" -e API_KEY="${var.api_key}" --restart always face-liveness-relay
  EOF

  tags = merge(var.tags, {
    Name = "${var.project}-face-liveness-relay"
  })
}

resource "aws_s3_bucket" "relay_bucket" {
  bucket = "${var.project}-face-liveness-relay-${var.environment}"
}

resource "aws_lightsail_instance_public_ports" "face_liveness_relay" {
  instance_name = aws_lightsail_instance.face_liveness_relay.name

  port_info {
    protocol  = "tcp"
    from_port = 8080
    to_port   = 8080
  }
}

output "relay_dns_name" {
  value = aws_lightsail_instance.face_liveness_relay.public_ip_address
}

output "relay_public_url" {
  value = "http://${aws_lightsail_instance.face_liveness_relay.public_ip_address}:8080"
}

output "relay_websocket_url" {
  value = "ws://${aws_lightsail_instance.face_liveness_relay.public_ip_address}:8080"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.relay_bucket.id
}
