resource "aws_cognito_identity_pool" "face_liveness" {
  identity_pool_name               = "${var.project}-face-liveness-identity-pool"
  allow_unauthenticated_identities = true

  cognito_identity_providers {
    client_id = aws_cognito_user_pool_client.face_liveness.id
    provider_name = aws_cognito_user_pool.face_liveness.endpoint
  }
}

resource "aws_cognito_user_pool" "face_liveness" {
  name = "${var.project}-face-liveness-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]

  schema {
    name = "email"
    attribute_data_type = "String"
    mutable = false
    required = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

resource "aws_cognito_user_pool_client" "face_liveness" {
  name         = "${var.project}-face-liveness-client"
  user_pool_id = aws_cognito_user_pool.face_liveness.id

  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

resource "aws_cognito_identity_pool_roles_attachment" "face_liveness" {
  identity_pool_id = aws_cognito_identity_pool.face_liveness.id
  roles = {
    "unauthenticated" = aws_iam_role.face_liveness_unauthenticated.arn
    "authenticated" = aws_iam_role.face_liveness_authenticated.arn
  }
}

resource "aws_iam_role" "face_liveness_unauthenticated" {
  name = "${var.project}-face-liveness-unauthenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.face_liveness.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "face_liveness_unauthenticated" {
  name = "${var.project}-face-liveness-unauthenticated-policy"
  role = aws_iam_role.face_liveness_unauthenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rekognition:CreateFaceLivenessSession",
          "rekognition:StartFaceLivenessSession",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "face_liveness_authenticated" {
  name = "${var.project}-face-liveness-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.face_liveness.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "face_liveness_authenticated" {
  name = "${var.project}-face-liveness-authenticated-policy"
  role = aws_iam_role.face_liveness_authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rekognition:CreateFaceLivenessSession",
          "rekognition:GetFaceLivenessSessionResults",
        ]
        Resource = "*"
      }
    ]
  })
}

output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.face_liveness.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.face_liveness.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.face_liveness.id
}
