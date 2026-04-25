# bedrock/rewriter.py
import boto3
import json
from typing import Literal

ToneType = Literal["formal", "friendly", "concise"]

TONE_INSTRUCTIONS = {
    "formal": """You are a professional workplace text rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text. (English input = English output, Thai input = Thai output).
2. PRESERVE CORE INTENT: Keep the original meaning exactly. If the user complains about work quality, keep the focus on work quality. Do not change it to difficulty or unrelated topics.
3. REMOVE TOXICITY: Replace insults, slurs, and aggressive words with polite, professional equivalents. 
4. NO HALLUCINATION: Do not add context, apologies, or extra questions that do not exist in the original text.
5. ONLY OUTPUT THE REWRITTEN TEXT: No introductory phrases like "Here is..." or "I will help...". No email sign-offs.""",

    "friendly": """You are a polite and collaborative workmate rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text. (English input = English output, Thai input = Thai output).
2. PRESERVE CORE INTENT: Keep the original message but soften the tone. For example, "This work is stupid" -> "This part of the work still needs some adjustments."
3. REMOVE TOXICITY: Strip out all insults and aggressive words. 
4. NO AI/THERAPIST BEHAVIOR: Do not offer emotional support, do not say "I understand," and do not say "I will help you rewrite this." Just provide the rewritten sentence as a normal colleague.
5. ONLY OUTPUT THE REWRITTEN TEXT: No conversational fillers or explanations.""",

    "concise": """You are a concise workplace text rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text.
2. KEEP IT SHORT & PRESERVE INTENT: Remove all insults and summarize the core message politely and directly.
3. NO EXTRA CONTENT: Do not add offers to help.
4. ONLY OUTPUT THE REWRITTEN TEXT."""
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