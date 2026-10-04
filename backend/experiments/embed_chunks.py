import os
from dotenv import load_dotenv
import voyageai
from ingest import load_and_chunk

load_dotenv()
vo = voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])

chunks = load_and_chunk("data/resume.pdf")
print(f"Total chunks: {len(chunks)}")

result = vo.embed(chunks, model="voyage-4-lite", input_type="document")
vectors = result.embeddings

print(f"Total vectors: {len(vectors)}")
print(f"Each vector dimension: {len(vectors[0])}")
