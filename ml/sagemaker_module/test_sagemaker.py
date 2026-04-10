from transformers import pipeline

toxicity_checker = pipeline("text-classification", model="textdetox/xlmr-large-toxicity-classifier")

def check_politeness(text):
    result = toxicity_checker(text)[0]
    label = result['label']
    score = result['score']
    
    status = "Polite/Neutral" if label == "neutral" else "Aggressive/Toxic"
    print(f"Text: {text}")
    print(f"Status: {status} (Confidence: {score:.4f})")
    print("-" * 30)

check_politeness("I really appreciate your help on this project.")
check_politeness("You are so stupid, why can't you do this right?")
check_politeness("ทำไมทำงานห่วยแบบนี้ ไม่ไหวเลยนะ") 