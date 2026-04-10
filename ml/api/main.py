# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
from sagemaker_module.inference import classify_politeness
from bedrock.rewriter import rewrite_message

app = FastAPI()

class MessageRequest(BaseModel):
    text: str
    tone: Literal["formal", "friendly", "concise"] = "formal"

class MessageResponse(BaseModel):
    original: str
    politeness_label: str
    politeness_score: float
    rewritten: str | None  # None ถ้าข้อความสุภาพอยู่แล้ว

@app.post("/analyze", response_model=MessageResponse)
def analyze_message(req: MessageRequest):
    classification = classify_politeness(req.text)

    rewritten = None

    if classification["label"] == "impolite" or classification["score"] < 0.90:
        rewritten = rewrite_message(req.text, tone=req.tone)

    return MessageResponse(
        original=req.text,
        politeness_label=classification["label"],
        politeness_score=classification["score"],
        rewritten=rewritten
    )

@app.get("/health")
def health():
    return {"status": "ok"}