variable "aws_region" {
  description = "AWS region for Face Liveness deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "lambda_function_names" {
  description = "Names for Lambda functions"
  type        = object({
    create_session = string
    get_results    = string
  })
  default = {
    create_session = "face-liveness-create-session"
    get_results    = "face-liveness-get-results"
  }
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

variable "api_name" {
  description = "API Gateway name"
  type        = string
  default     = "face-liveness-api"
}

variable "api_key_name" {
  description = "API Key name"
  type        = string
  default     = "face-liveness-api-key"
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "usage_plan_name" {
  description = "Usage plan name"
  type        = string
  default     = "face-liveness-usage-plan"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "app-perfilamiento"
    Component   = "face-liveness"
    Environment = "dev"
  }
}

variable "project" {
  description = "Project name for resource naming"
  type        = string
  default     = "app-perfilamiento"
}
