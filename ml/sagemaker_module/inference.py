import boto3
import json

ENDPOINT_NAME = "polite-guard-endpoint"

def classify_politeness(text: str) -> dict:
    client = boto3.client("sagemaker-runtime", region_name="ap-southeast-1")
    payload = json.dumps({"inputs": text})

    response = client.invoke_endpoint(
        EndpointName=ENDPOINT_NAME,
        ContentType="application/json",
        Body=payload
    )

    result = json.loads(response["Body"].read().decode("utf-8"))
    top = result[0]
    
    raw_label = top["label"] 

    mapped_label = "polite" if raw_label == "neutral" else "impolite"

    return {"label": mapped_label, "score": top["score"]}