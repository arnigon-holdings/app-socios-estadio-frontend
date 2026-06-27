data "archive_file" "create_session_zip" {
  type        = "zip"
  source_file = "${path.module}/src/create_session.py"
  output_path = "${path.module}/src/create_session.zip"
}

data "archive_file" "get_results_zip" {
  type        = "zip"
  source_file = "${path.module}/src/get_results.py"
  output_path = "${path.module}/src/get_results.zip"
}

resource "aws_lambda_function" "create_session" {
  filename         = data.archive_file.create_session_zip.output_path
  function_name    = var.lambda_function_names.create_session
  role            = var.iam_role_arn
  handler         = "create_session.lambda_handler"
  source_code_hash = data.archive_file.create_session_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      AWS_MAX_ATTEMPTS = "3"
    }
  }
}

resource "aws_lambda_function" "get_results" {
  filename         = data.archive_file.get_results_zip.output_path
  function_name    = var.lambda_function_names.get_results
  role            = var.iam_role_arn
  handler         = "get_results.lambda_handler"
  source_code_hash = data.archive_file.get_results_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      AWS_MAX_ATTEMPTS = "3"
    }
  }
}
