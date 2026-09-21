# PDF RAG Chatbot

A Retrieval-Augmented Generation (RAG) system that lets you upload a PDF and ask questions about its content in natural language.

## 🚧 Project Status: In Development

Currently working on: **Phase 2 — Document Understanding (PDF Ingestion)**

## Tech Stack
- **Backend:** Python, FastAPI (planned)
- **Frontend:** React/Next.js (planned)
- **PDF Processing:** PyMuPDF
- **Text Chunking:** LangChain Text Splitters

## Setup
\`\`\`bash
git clone <repo-url>
cd pdf-rag-chatbot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

## Project Structure
\`\`\`
pdf-rag-chatbot/
├── data/           # Sample PDFs for testing
├── ingest.py       # PDF loading & chunking logic
├── extract.py      # Script to test ingestion
├── requirements.txt
└── wiki.md         # Detailed development log & learning notes
\`\`\`
