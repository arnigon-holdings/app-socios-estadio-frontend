variable "lambda_function_names" {
  description = "Names for Lambda functions"
  type        = object({
    create_session = string
    get_results    = string
  })
}

variable "iam_role_arn" {
  description = "ARN of the IAM role for Lambda execution"
  type        = string
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128
}
