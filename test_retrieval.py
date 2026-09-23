from retrieval import search

results = search("What programming languages does this person know?")
for i, doc in enumerate(results):
    print(f"--- Result {i+1} ---")
    print(doc)
    print()
