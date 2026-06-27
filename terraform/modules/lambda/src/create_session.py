import boto3
import json
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

rekognition = boto3.client("rekognition")


class FaceLivenessError(Exception):
    pass


def create_session():
    try:
        response = rekognition.create_face_liveness_session()
        session_id = response.get("SessionId")
        logger.info(f"Created Face Liveness session: {session_id}")
        return session_id
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error(f"AWS Error: {error_code} - {e.response['Error']['Message']}")
        raise FaceLivenessError(f"AWS Error: {error_code}")


def get_signed_websocket_url(session_id: str) -> str:
    region = "us-east-1"
    service = "rekognition"
    host = f"rekognition-streaming.{region}.amazonaws.com"
    endpoint = f"wss://{host}/2023-09-30/livenessessions/{session_id}"

    credentials = rekognition._request_signer._credentials
    access_key = credentials.access_key
    secret_key = credentials.secret_key
    session_token = credentials.token

    import datetime
    import hashlib
    import hmac

    now = datetime.datetime.utcnow()
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")

    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    signed_headers = "host"

    canonical_uri = f"/2023-09-30/livenessessions/{session_id}"
    payload_hash = hashlib.sha256(b"").hexdigest()

    canonical_headers = f"host:{host}\n"
    canonical_querystring = (
        f"X-Amz-Algorithm=AWS4-HMAC-SHA256"
        f"&X-Amz-Credential={access_key}%2F{credential_scope}"
        f"&X-Amz-Date={amz_date}"
        f"&X-Amz-Expires=86400"
        f"&X-Amz-SignedHeaders={signed_headers}"
    )

    canonical_request = "\n".join([
        "GET",
        canonical_uri,
        canonical_querystring,
        canonical_headers,
        signed_headers,
        payload_hash,
    ])

    algorithm = "AWS4-HMAC-SHA256"
    string_to_sign = "\n".join([
        algorithm,
        amz_date,
        credential_scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    k_date = hmac.new(
        ("AWS4" + secret_key).encode(), date_stamp.encode(), hashlib.sha256
    ).digest()
    k_region = hmac.new(k_date, region.encode(), hashlib.sha256).digest()
    k_service = hmac.new(k_region, service.encode(), hashlib.sha256).digest()
    k_signing = hmac.new(k_service, b"aws4_request", hashlib.sha256).digest()
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()

    if session_token:
        canonical_querystring += f"&X-Amz-Security-Token={session_token}"

    signed_url = (
        f"{endpoint}?"
        f"X-Amz-Algorithm=AWS4-HMAC-SHA256"
        f"&X-Amz-Credential={access_key}%2F{credential_scope}"
        f"&X-Amz-Date={amz_date}"
        f"&X-Amz-Expires=86400"
        f"&X-Amz-SignedHeaders={signed_headers}"
        f"&X-Amz-Signature={signature}"
    )
    if session_token:
        signed_url += f"&X-Amz-Security-Token={session_token}"

    return signed_url


def lambda_handler(event, context):
    logger.info("Creating Face Liveness session")
    try:
        session_id = create_session()

        try:
            signed_url = get_signed_websocket_url(session_id)
            logger.info(f"Generated signed WebSocket URL for session: {session_id}")
        except Exception as e:
            logger.warning(f"Could not generate signed URL: {e}")
            signed_url = None

        body = {"sessionId": session_id}
        if signed_url:
            body["signedWebSocketUrl"] = signed_url

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            "body": json.dumps(body),
        }
    except FaceLivenessError as e:
        logger.error(f"FaceLivenessError: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": str(e)}),
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Internal server error"}),
        }
