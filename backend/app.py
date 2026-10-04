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
        print(f"Error processing question: {e}")
        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily unavailable. Please try again in a moment."
        )


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        save_path = f"data/{file.filename}"
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        chunk_count = build_index(save_path)
        return {"message": f"Successfully indexed {chunk_count} chunks from {file.filename}"}
    except Exception as e:
        print(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to process the uploaded PDF.")
