from ingest import load_and_chunk

chunks = load_and_chunk("data/resume.pdf")

for i, chunk in enumerate(chunks):
    print(f"--- Chunk {i+1} ---")
    print(chunk)
    print()
