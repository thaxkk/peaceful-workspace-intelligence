# sagemaker/inference.py
import boto3
import json

ENDPOINT_NAME = "polite-guard-endpoint"

def classify_politeness(text: str) -> dict:
    """
    Returns: {
        "label": "polite" | "impolite",
        "score": float (0.0 - 1.0)
    }
    """
    client = boto3.client("sagemaker-runtime", region_name="ap-southeast-1")

    payload = json.dumps({"inputs": text})

    response = client.invoke_endpoint(
        EndpointName=ENDPOINT_NAME,
        ContentType="application/json",
        Body=payload
    )

    result = json.loads(response["Body"].read().decode("utf-8"))
    # result รูปแบบ: [{"label": "polite", "score": 0.95}]
    top = result[0]
    return {"label": top["label"], "score": top["score"]}