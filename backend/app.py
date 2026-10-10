import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from retrieval import search, build_index
from generation import generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


def classify_error(e, fallback="Something went wrong while processing your request."):
    """Turn an internal exception into (HTTP status, safe message for the user)."""
    name = type(e).__name__
    code = getattr(e, "code", None)

    if name == "RateLimitError":  # Voyage AI: too many requests per minute
        return 429, "Too many requests in a short time. Please wait about 30 seconds and try again."
    if code == 429:  # Gemini: usage limit reached
        return 429, "The AI usage limit has been reached. Please try again later."
    if code in (500, 503, 504):  # Gemini: temporarily overloaded
        return 503, "The AI service is busy right now. Please try again in a moment."
    return 500, fallback


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.post("/ask")
def ask_question(request: QuestionRequest):
    try:
        chunks = search(request.question)
        answer = generate_answer(request.question, chunks)
        return {"answer": answer}
    except Exception as e:
        print(f"Error processing question [{type(e).__name__}]: {e}")
        status, message = classify_error(e)
        raise HTTPException(status_code=status, detail=message)


@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):
    try:
        save_path = f"data/{file.filename}"
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        chunk_count = build_index(save_path)
        print(f"Indexed {chunk_count} chunks from {file.filename}")
        return {"message": f"{file.filename} uploaded successfully. You can now ask questions about it."}
    except Exception as e:
        print(f"Error processing upload [{type(e).__name__}]: {e}")
        status, message = classify_error(e, fallback="Failed to process the uploaded PDF.")
        raise HTTPException(status_code=status, detail=message)
