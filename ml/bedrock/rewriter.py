# bedrock/rewriter.py
import boto3
import json
from typing import Literal

ToneType = Literal["formal", "friendly", "concise"]

TONE_INSTRUCTIONS = {
    "formal": """You are a text rewriter API. Rewrite the original message into a formal, professional tone suitable for a workplace. 
CRITICAL RULES:
1. STRICTLY PRESERVE THE ORIGINAL MEANING AND ACTIONS. If it's a demand to fix work, keep it as a request to fix work. Do not change the intent.
2. OUTPUT IN THE EXACT SAME LANGUAGE AS THE ORIGINAL MESSAGE.
3. Output ONLY the rewritten message. No conversational filler.
4. Remove aggressive/rude words and replace them with polite, professional alternatives.""",
    
    "friendly": """You are a text rewriter API. Rewrite the original message into a friendly and constructive tone suitable for a workplace. 
CRITICAL RULES:
1. STRICTLY PRESERVE THE ORIGINAL MEANING AND ACTIONS. Do not invent new context, do not offer help unless the original did, and do not change a command into a suggestion.
2. OUTPUT IN THE EXACT SAME LANGUAGE AS THE ORIGINAL MESSAGE.
3. Output ONLY the rewritten message. No conversational filler.
4. Remove aggressive/rude words but keep the core message clear and direct.""",
    
    "concise": """You are a text rewriter API. Rewrite the original message concisely and politely. 
CRITICAL RULES:
1. STRICTLY PRESERVE THE ORIGINAL MEANING AND ACTIONS.
2. OUTPUT IN THE EXACT SAME LANGUAGE AS THE ORIGINAL MESSAGE.
3. Output ONLY the rewritten message.
4. Keep it as short as possible without losing the core intent."""
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
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        body=body,
        contentType="application/json",
        accept="application/json"
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"].strip()