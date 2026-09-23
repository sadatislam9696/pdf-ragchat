import os
from dotenv import load_dotenv
import voyageai
import chromadb
from ingest import load_and_chunk

load_dotenv()
vo = voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])
client = chromadb.PersistentClient(path="./chroma_db")


def build_index(pdf_path, collection_name="resume_chunks"):
    """একবার চালানোর জন্য: PDF থেকে chunk বানিয়ে, embed করে, storage-এ রাখে"""
    chunks = load_and_chunk(pdf_path)
    result = vo.embed(chunks, model="voyage-4-lite", input_type="document")

    collection = client.get_or_create_collection(
        name=collection_name,
        configuration={"hnsw": {"space": "cosine"}}
    )
    ids = [f"chunk-{i}" for i in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, embeddings=result.embeddings)
    return collection.count()


def search(query, collection_name="resume_chunks", k=3):
    """প্রতি user-question-এ চালানোর জন্য: দ্রুত top-k relevant chunk খুঁজে আনে"""
    collection = client.get_or_create_collection(name=collection_name)
    query_vector = vo.embed([query], model="voyage-4-lite", input_type="query").embeddings[0]

    results = collection.query(query_embeddings=[query_vector], n_results=k)
    return results["documents"][0]
