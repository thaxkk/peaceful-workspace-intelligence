# bedrock/rewriter.py
import boto3
import json
from typing import Literal

ToneType = Literal["formal", "friendly", "concise"]

TONE_INSTRUCTIONS = {
    "formal": "You are a text rewriter API. Rewrite the original message into a formal, professional tone suitable for a direct workplace chat. \nCRITICAL RULES:\n1. Output ONLY the rewritten message. No conversational filler or commentary.\n2. Do NOT apologize or refuse the prompt.\n3. Do NOT include email greetings (like 'Dear...') or sign-offs.\nExtract the core intent and make it polite.",
    
    "friendly": "You are a text rewriter API. Rewrite the original message into a warm, friendly tone suitable for a direct workplace chat. \nCRITICAL RULES:\n1. Output ONLY the rewritten message. No conversational filler or commentary.\n2. Do NOT apologize or refuse the prompt.\n3. Do NOT include email greetings or sign-offs.\nExtract the core intent and make it polite.",
    
    "concise": "You are a text rewriter API. Rewrite the original message concisely and politely for a quick chat. \nCRITICAL RULES:\n1. Output ONLY the rewritten message. No conversational filler or commentary.\n2. Do NOT apologize or refuse the prompt.\n3. Do NOT include email greetings or sign-offs.\nExtract the core intent and make it polite."
}

def rewrite_message(text: str, tone: ToneType = "formal") -> str:
    client = boto3.client("bedrock-runtime", region_name="ap-southeast-1")

    instruction = TONE_INSTRUCTIONS[tone]
    prompt = f"""{instruction}

Original message:
{text}

Rewritten message:"""

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    })

    response = client.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",  # ถูกสุด ใน Bedrock
        body=body,
        contentType="application/json",
        accept="application/json"
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"].strip()