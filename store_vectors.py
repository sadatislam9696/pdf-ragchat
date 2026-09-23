
import os
from dotenv import load_dotenv
import voyageai
import chromadb
from ingest import load_and_chunk

load_dotenv()
vo = voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])

# Step 1: Chunk তৈরি করা (Phase 2)
chunks = load_and_chunk("data/resume.pdf")

# Step 2: Embedding তৈরি করা (Phase 3)
result = vo.embed(chunks, model="voyage-4-lite", input_type="document")
vectors = result.embeddings

# Step 3: ChromaDB-তে সংরক্ষণ করা (Phase 4, নতুন)
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="resume_chunks",
    configuration={"hnsw": {"space": "cosine"}}
)

ids = [f"chunk-{i}" for i in range(len(chunks))]

collection.add(
    ids=ids,
    documents=chunks,
    embeddings=vectors
)

print(f"{collection.count()} টা chunk সফলভাবে সংরক্ষণ হয়েছে।")
