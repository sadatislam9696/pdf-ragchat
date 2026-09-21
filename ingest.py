import re
import pymupdf as fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_and_chunk(pdf_path, chunk_size=200, chunk_overlap=30):
    doc = fitz.open(pdf_path)

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    cleaned_text = re.sub(r'(?<!\n)\n(?!\n)', ' ', full_text)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_text(cleaned_text)
