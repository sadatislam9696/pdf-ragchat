import os
from dotenv import load_dotenv
import voyageai
import numpy as np

load_dotenv()

vo = voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])

texts = [
    "I love competitive programming",
    "I enjoy solving algorithmic problems",   # কাছাকাছি অর্থ
    "The weather is sunny today"              # সম্পূর্ণ ভিন্ন অর্থ
]

result = vo.embed(texts, model="voyage-4-lite", input_type="document")
vectors = result.embeddings

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

sim_1_2 = cosine_similarity(vectors[0], vectors[1])
sim_1_3 = cosine_similarity(vectors[0], vectors[2])

print("Similarity (competitive programming vs algorithmic problems):", sim_1_2)
print("Similarity (competitive programming vs weather):", sim_1_3)
