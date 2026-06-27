import boto3
import json
import base64
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

rekognition = boto3.client("rekognition")


class FaceLivenessError(Exception):
    pass


def get_session_results(session_id: str):
    try:
        response = rekognition.get_face_liveness_session_results(SessionId=session_id)

        reference_image_bytes = response.get("ReferenceImage", {}).get("Bytes", b"")
        reference_image_base64 = base64.b64encode(reference_image_bytes).decode("utf-8")

        audit_images = []
        for idx, audit_img in enumerate(response.get("AuditImages", [])):
            audit_bytes = audit_img.get("Bytes", b"")
            audit_images.append({
                "index": idx,
                "bytes": base64.b64encode(audit_bytes).decode("utf-8"),
            })

        result = {
            "sessionId": response.get("SessionId"),
            "status": response.get("Status"),
            "confidence": response.get("Confidence"),
            "referenceImage": {
                "bytes": reference_image_base64,
            },
            "auditImages": audit_images,
        }

        logger.info(f"Retrieved Face Liveness results for session: {session_id}, status: {response.get('Status')}")
        return result

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error(f"AWS Error: {error_code} - {e.response['Error']['Message']}")
        raise FaceLivenessError(f"AWS Error: {error_code}")


def lambda_handler(event, context):
    logger.info("Getting Face Liveness session results")

    session_id = (event.get("pathParameters") or {}).get("sessionId")

    if not session_id:
        logger.error("Missing sessionId in path parameters")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Missing sessionId"}),
        }

    try:
        result = get_session_results(session_id)
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
            },
            "body": json.dumps(result),
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
