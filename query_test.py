import os
from dotenv import load_dotenv
import voyageai
import chromadb

load_dotenv()
vo = voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="resume_chunks")

user_question = "What programming languages does this person know?"

query_result = vo.embed([user_question], model="voyage-4-lite", input_type="query")
query_vector = query_result.embeddings[0]

results = collection.query(
    query_embeddings=[query_vector],
    n_results=3
)

for i, doc in enumerate(results["documents"][0]):
    distance = results["distances"][0][i]
    print(f"--- Match {i+1} (distance: {distance:.4f}) ---")
    print(doc)
    print()
