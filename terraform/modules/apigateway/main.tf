data "aws_lambda_function" "create_session" {
  function_name = "face-liveness-create-session"
}

data "aws_lambda_function" "get_results" {
  function_name = "face-liveness-get-results"
}

resource "aws_api_gateway_rest_api" "face_liveness" {
  name        = var.api_name
  description = "API Gateway for Face Liveness service"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "face_liveness" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  parent_id   = aws_api_gateway_rest_api.face_liveness.root_resource_id
  path_part   = "face-liveness"
}

resource "aws_api_gateway_resource" "sessions" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  parent_id   = aws_api_gateway_resource.face_liveness.id
  path_part   = "sessions"
}

resource "aws_api_gateway_resource" "session_results" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  parent_id   = aws_api_gateway_resource.sessions.id
  path_part   = "{sessionId}"
}

resource "aws_api_gateway_resource" "session_results_path" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  parent_id   = aws_api_gateway_resource.session_results.id
  path_part   = "results"
}

resource "aws_api_gateway_method" "create_session" {
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  resource_id   = aws_api_gateway_resource.sessions.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_session_lambda" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.sessions.id
  http_method = aws_api_gateway_method.create_session.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${data.aws_lambda_function.create_session.arn}/invocations"
}

resource "aws_api_gateway_method" "get_results" {
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  resource_id   = aws_api_gateway_resource.session_results_path.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_results_lambda" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.session_results_path.id
  http_method = aws_api_gateway_method.get_results.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${data.aws_lambda_function.get_results.arn}/invocations"
}

resource "aws_lambda_permission" "allow_api_gateway_create_session" {
  statement_id  = "AllowAPIGatewayInvokeCreateSession"
  action       = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.create_session.function_name
  principal    = "apigateway.amazonaws.com"
  source_arn  = "${aws_api_gateway_rest_api.face_liveness.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_get_results" {
  statement_id  = "AllowAPIGatewayInvokeGetResults"
  action       = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.get_results.function_name
  principal    = "apigateway.amazonaws.com"
  source_arn  = "${aws_api_gateway_rest_api.face_liveness.execution_arn}/*/*"
}

locals {
  cors_allowed_headers = "'Content-Type,X-Api-Key,Accept,Origin'"
  cors_allowed_methods = "'POST,GET,OPTIONS'"
  cors_allowed_origin = "'*'"
}

resource "aws_api_gateway_method" "options_face_liveness" {
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  resource_id   = aws_api_gateway_resource.face_liveness.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_face_liveness_200" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.face_liveness.id
  http_method = aws_api_gateway_method.options_face_liveness.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method" "options_sessions" {
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  resource_id   = aws_api_gateway_resource.sessions.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_sessions_200" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.sessions.id
  http_method = aws_api_gateway_method.options_sessions.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method" "options_session_results" {
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  resource_id   = aws_api_gateway_resource.session_results_path.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_session_results_200" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.session_results_path.id
  http_method = aws_api_gateway_method.options_session_results.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_mock_face_liveness" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.face_liveness.id
  http_method = "OPTIONS"
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "options_mock_sessions" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.sessions.id
  http_method = "OPTIONS"
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "options_mock_session_results" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.session_results_path.id
  http_method = "OPTIONS"
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_response_face_liveness" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.face_liveness.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = local.cors_allowed_headers
    "method.response.header.Access-Control-Allow-Methods" = local.cors_allowed_methods
    "method.response.header.Access-Control-Allow-Origin"  = local.cors_allowed_origin
  }

  depends_on = [
    aws_api_gateway_integration.options_mock_face_liveness,
    aws_api_gateway_method_response.options_face_liveness_200,
  ]
}

resource "aws_api_gateway_integration_response" "options_response_sessions" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.sessions.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = local.cors_allowed_headers
    "method.response.header.Access-Control-Allow-Methods" = local.cors_allowed_methods
    "method.response.header.Access-Control-Allow-Origin"  = local.cors_allowed_origin
  }

  depends_on = [
    aws_api_gateway_integration.options_mock_sessions,
    aws_api_gateway_method_response.options_sessions_200,
  ]
}

resource "aws_api_gateway_integration_response" "options_response_session_results" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id
  resource_id = aws_api_gateway_resource.session_results_path.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = local.cors_allowed_headers
    "method.response.header.Access-Control-Allow-Methods" = local.cors_allowed_methods
    "method.response.header.Access-Control-Allow-Origin"  = local.cors_allowed_origin
  }

  depends_on = [
    aws_api_gateway_integration.options_mock_session_results,
    aws_api_gateway_method_response.options_session_results_200,
  ]
}

resource "aws_api_gateway_deployment" "face_liveness" {
  rest_api_id = aws_api_gateway_rest_api.face_liveness.id

  depends_on = [
    aws_api_gateway_integration.create_session_lambda,
    aws_api_gateway_integration.get_results_lambda,
    aws_api_gateway_integration.options_mock_face_liveness,
    aws_api_gateway_integration.options_mock_sessions,
    aws_api_gateway_integration.options_mock_session_results,
    aws_api_gateway_method_response.options_face_liveness_200,
    aws_api_gateway_method_response.options_sessions_200,
    aws_api_gateway_method_response.options_session_results_200,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.face_liveness.id
  rest_api_id   = aws_api_gateway_rest_api.face_liveness.id
  stage_name    = var.api_stage_name
}

resource "aws_api_gateway_api_key" "main" {
  name        = var.api_key_name
  description = "API Key for Face Liveness service"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_usage_plan" "main" {
  name = var.usage_plan_name

  api_stages {
    api_id = aws_api_gateway_rest_api.face_liveness.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }

  quota_settings {
    limit  = 10000
    period = "MONTH"
  }

  throttle_settings {
    burst_limit = 100
    rate_limit  = 50
  }
}

resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}
