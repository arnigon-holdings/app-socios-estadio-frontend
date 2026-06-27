output "create_session_lambda_arn" {
  description = "ARN of the create session Lambda function"
  value       = aws_lambda_function.create_session.arn
}

output "create_session_lambda_invoke_arn" {
  description = "Invoke ARN of the create session Lambda function"
  value       = aws_lambda_function.create_session.invoke_arn
}

output "create_session_lambda_name" {
  description = "Name of the create session Lambda function"
  value       = aws_lambda_function.create_session.function_name
}

output "get_results_lambda_arn" {
  description = "ARN of the get results Lambda function"
  value       = aws_lambda_function.get_results.arn
}

output "get_results_lambda_invoke_arn" {
  description = "Invoke ARN of the get results Lambda function"
  value       = aws_lambda_function.get_results.invoke_arn
}

output "get_results_lambda_name" {
  description = "Name of the get results Lambda function"
  value       = aws_lambda_function.get_results.function_name
}
