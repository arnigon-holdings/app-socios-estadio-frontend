terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

module "iam" {
  source = "./modules/iam"
}

module "lambda" {
  source = "./modules/lambda"

  lambda_function_names = var.lambda_function_names
  lambda_timeout        = var.lambda_timeout
  lambda_memory_size    = var.lambda_memory_size
  iam_role_arn          = module.iam.lambda_execution_role_arn
}

module "apigateway" {
  source = "./modules/apigateway"

  api_name        = var.api_name
  api_key_name    = var.api_key_name
  api_stage_name  = var.api_stage_name
  usage_plan_name = var.usage_plan_name
}

module "cognito" {
  source = "./modules/cognito"

  project = var.project
  tags    = var.tags
}
