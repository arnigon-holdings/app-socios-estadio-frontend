output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.face_liveness.id
}

output "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_api_gateway_rest_api.face_liveness.id
}

output "api_gateway_endpoint_url" {
  description = "Full endpoint URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.face_liveness.id}.execute-api.us-east-1.amazonaws.com/${var.api_stage_name}"
}

output "api_key_id" {
  description = "ID of the API Key"
  value       = aws_api_gateway_api_key.main.id
}

output "api_key_value" {
  description = "Value of the API Key"
  value       = aws_api_gateway_api_key.main.value
}

output "usage_plan_id" {
  description = "ID of the Usage Plan"
  value       = aws_api_gateway_usage_plan.main.id
}
