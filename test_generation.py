from retrieval import search
from generation import generate_answer

question = "What is this person's expected salary?"

chunks = search(question)
answer = generate_answer(question, chunks)

print("Question:", question)
print("\nAnswer:", answer)
