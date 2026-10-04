# PDF RAG Chatbot

Upload a PDF and ask questions about it in natural language. Answers are generated **only from the document's content** (Retrieval-Augmented Generation), and the app says so when the document does not contain the answer.

Full-stack project: FastAPI backend + React (Vite) frontend. Built step by step as a learning project; the complete reasoning, bugs and trade-offs are recorded in [`wiki.md`](wiki.md).

## Status

Works end to end on a local machine (upload, ask, grounded answer, user-facing error messages). **Not deployed yet.** See the [roadmap](#roadmap) and [known limitations](#known-limitations).

## How it works

```
PDF
 └─► PyMuPDF text extraction + cleaning
      └─► Recursive chunking (600 chars, 100 overlap)
           └─► Voyage AI embeddings (voyage-4-lite, 1024-dim)
                └─► ChromaDB (cosine similarity, persistent)

Question
 └─► Voyage AI query embedding
      └─► top-5 most similar chunks from ChromaDB
           └─► Gemini, with a grounded prompt ("answer only from these sources")
                └─► Answer shown in the React UI
```

## Tech stack

| Layer | Choice |
|---|---|
| PDF parsing | PyMuPDF |
| Chunking | LangChain `RecursiveCharacterTextSplitter` |
| Embeddings | Voyage AI `voyage-4-lite` |
| Vector database | ChromaDB (local, cosine distance) |
| LLM | Google Gemini (`google-genai`) |
| Backend | Python, FastAPI, Uvicorn |
| Frontend | React + Vite |

## Setup

You need Python 3.13, Node.js 20+, and two API keys: [Voyage AI](https://dashboard.voyageai.com/) and [Google AI Studio](https://aistudio.google.com/) (both have free tiers).

### Backend

```bash
git clone <repo-url>
cd pdf-rag-chatbot/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (never commit it):

```
VOYAGE_API_KEY=your-voyage-key
GEMINI_API_KEY=your-gemini-key
```

Run the server (from the `backend/` folder):

```bash
uvicorn app:app --reload
```

API docs are at http://127.0.0.1:8000/docs.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, upload a PDF, wait for "Successfully indexed", then ask a question.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/upload` | Upload a PDF; it is chunked, embedded and indexed (replaces the previous index) |
| POST | `/ask` | Body `{"question": "..."}`; returns an answer grounded in the indexed PDF |

## Project structure

```
pdf-rag-chatbot/
├── backend/
│   ├── app.py            # FastAPI app: /upload, /ask, CORS, error handling
│   ├── ingest.py         # PDF loading, cleaning, chunking
│   ├── retrieval.py      # Embedding + ChromaDB indexing and search
│   ├── generation.py     # Prompt + Gemini call
│   ├── evaluate.py       # Retrieval/answer evaluation script
│   ├── experiments/      # Step-by-step learning scripts (history)
│   └── requirements.txt
├── frontend/             # React + Vite UI
├── wiki.md               # Development log, decisions, bugs and lessons
└── README.md
```

`backend/data/`, `backend/chroma_db/`, `backend/.env` and `venv/` are git-ignored: bring your own PDFs.

## Evaluation

- **Retrieval Recall@3: 100% (5/5)** on a 5-question golden set built from the author's resume (a hit means the expected keyword appears in the top-3 chunks).
- **Answer accuracy: 5/5**, checked manually.

These numbers are real but small-sample. A later test on a denser academic PDF exposed two retrieval-configuration bugs that this set could not catch:

1. **Wrong collection:** `search()` queried a stale collection name, so answers came from the previous document.
2. **Chunk size too small for dense content:** a team-members table was split across chunks and not fully retrieved. Fixed by raising `chunk_size` 200 → 600, `chunk_overlap` 30 → 100 and `k` 3 → 5.

In both cases the LLM never invented an answer; it only used the chunks it was given. Expanding the evaluation set (multi-chunk and "not in the document" questions) is on the roadmap. The evaluation PDF is the author's own resume and is not included in this repository.

## Known limitations

- **One document at a time.** Uploading a new PDF replaces the index for everyone using the server.
- **Free-tier limits.** Voyage without a payment method allows 3 requests/minute; Gemini's free tier has a small daily quota. The UI shows a generic "service temporarily unavailable" message in these cases.
- **Privacy.** Document text is sent to Voyage AI and Google. Gemini's free tier may use submitted content to improve Google's models, so do not upload sensitive documents.
- **Text PDFs only.** Scanned (image-only) PDFs have no extractable text and are not supported (no OCR).
- **No authentication or upload validation yet** (type/size checks are planned).

## Roadmap

- Hardening: upload validation, central config via environment variables, rate-limit-aware errors (429 + retry), per-document indexes
- Answers with sources and page numbers; "not found in the document" threshold
- Larger evaluation set and automated tests with CI
- Deployment (backend + static frontend)
- Google Docs / Slides via "Export as PDF" (same pipeline); hybrid (keyword + vector) search; conversation memory