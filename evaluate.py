import time
from retrieval import search
from generation import generate_answer

test_set = [
    {"question": "What programming languages does this person know?", "expected_keyword": "JavaScript"},
    {"question": "What university does this person study at?", "expected_keyword": "Bangladesh University of Business"},
    {"question": "What was this person's role at Bangladesh University of Business & Technology?", "expected_keyword": "Competitive Programming Trainer"},
    {"question": "What technologies were used in the CampusLink project?", "expected_keyword": "React Native"},
    {"question": "What is this person's Codeforces rating?", "expected_keyword": "1421"},
]

hits = 0

for item in test_set:
    question = item["question"]
    expected = item["expected_keyword"]

    chunks = search(question, k=3)
    retrieved_text = " ".join(chunks)
    is_hit = expected in retrieved_text

    if is_hit:
        hits += 1

    answer = generate_answer(question, chunks)

    print(f"Q: {question}")
    print(f"Retrieval hit: {'✅' if is_hit else '❌'}")
    print(f"Answer: {answer}")
    print("-" * 50)

    time.sleep(21)  # Voyage AI free-tier rate limit (3 RPM) মেনে চলা

recall_at_3 = hits / len(test_set)
print(f"\nRecall@3: {recall_at_3:.2%} ({hits}/{len(test_set)})")
