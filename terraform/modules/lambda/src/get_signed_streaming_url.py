import json
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    logger.info("Generating pre-signed WebSocket URL for Face Liveness streaming")
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps({
            "message": "Streaming URL signing is handled client-side using AWS SDK. This endpoint returns the streaming configuration.",
            "note": "The FaceLiveness component in src/components/face-liveness.tsx handles WebSocket streaming directly using AWS SDK browser credentials."
        }),
    }
