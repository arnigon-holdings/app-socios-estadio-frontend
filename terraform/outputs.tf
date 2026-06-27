output "api_gateway_url" {
  description = "API Gateway base URL"
  value       = module.apigateway.api_gateway_endpoint_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.apigateway.api_gateway_id
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.apigateway.api_gateway_endpoint
}

output "api_key" {
  description = "API Key value (use with caution - sensitive)"
  value      = module.apigateway.api_key_value
  sensitive  = true
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    create_session = module.lambda.create_session_lambda_arn
    get_results    = module.lambda.get_results_lambda_arn
  }
}

output "lambda_function_names" {
  description = "Lambda function names"
  value = {
    create_session = module.lambda.create_session_lambda_name
    get_results    = module.lambda.get_results_lambda_name
  }
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID for Face Liveness"
  value       = module.cognito.cognito_identity_pool_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for Face Liveness"
  value       = module.cognito.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID for Face Liveness"
  value       = module.cognito.cognito_user_pool_client_id
}
