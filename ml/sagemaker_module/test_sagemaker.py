from inference import classify_politeness

test_cases = [
    "Could you please review this when you have a moment?",  
    "Why haven't you done this yet?! This is unacceptable!",  
    "I need this done now.",  
]

for text in test_cases:
    result = classify_politeness(text)
    print(f"Text: {text}")
    print(f"→ {result['label']} (score: {result['score']:.2f})\n")