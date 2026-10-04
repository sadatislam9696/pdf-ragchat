# PDF চ্যাটবট (RAG) — Project Wiki

> এই ফাইলটা পুরো প্রজেক্টের "living documentation" — প্রতিটা Phase ও Step শেষ হওয়ার সাথে সাথে এখানে আপডেট হবে। শেষে এটাই হবে পুরো project-এর reasoning + journey-এর record (GitHub README-এর সাথেও ব্যবহার করা যাবে)।

---

## 📌 Project Overview

| বিষয় | সিদ্ধান্ত |
|---|---|
| **Project** | PDF চ্যাটবট (RAG-based) |
| **Content/Language** | PDF ও Question-Answer সব English-এ |
| **Input Formats** | Pipeline মূলত PDF-only থাকবে। Google Docs/Slides ব্যবহার করতে চাইলে user নিজে "Export as PDF" করে নেবে — একই `ingest.py` pipeline reuse হবে, নতুন কোড লাগবে না (SlideShare বাদ দেওয়া হয়েছে, কারণ ওদের API কার্যত বন্ধ/অনির্ভরযোগ্য) |
| **Learning Style** | Code মুখস্থ না, concept + hands-on task একসাথে — Just-in-Time Learning (প্রতিটা step-এ যা লাগবে ঠিক ততটুকুই শেখা) |
| **Ambition** | Production-level, high accuracy target |
| **Final Output** | Full-stack web app — FastAPI (backend) + React/Vite (frontend) |
| **Deliverable** | GitHub portfolio project |
| **Rule** | প্রতিটা নতুন Phase শুরুর আগে অনুমতি নেওয়া হবে; Phase-এর ভিতরের Step গুলো normally চলতে থাকবে |

### Roadmap (Phases)
1. Problem Formulation ✅
2. Document Understanding (PDF Ingestion) ✅
3. Embedding (Text → Vector) ✅
4. Vector Storage & Retrieval ✅
5. Generation (LLM Integration) ✅
6. Evaluation ✅ (আরও শক্ত করার সুযোগ আছে — নিচের Review দেখো)
7. Backend API Layer (FastAPI) ✅
8. Frontend (React + Vite) ✅ (+ PDF Upload addendum)
8.5. Hardening (Review-এর পরের phase) — 🔄 *চলছে: Step 0 (structure) ✅, Step 1 (Gemini retry) ✅, বাকিগুলো পরবর্তী ধাপে*
9. Deployment (optional)

---

## ✅ Phase 1: Problem Formulation

**Status:** সম্পূর্ণ

### Step 1 — সমস্যাটা আসলে কী?

**Core Problem:** LLM-এর দুইটা limitation — (1) Knowledge cutoff, (2) Private/specific data সম্পর্কে জানে না। এর সমাধান দুইভাবে করা যায়: Fine-tuning (costly, সময়সাপেক্ষ) বা RAG (সস্তা, দ্রুত, real-time আপডেট করা যায়)। আমরা RAG পথে যাচ্ছি।

**তিনটা Sub-problem:**

| # | Sub-problem | সহজ ভাষায় |
|---|---|---|
| 1 | Document Understanding | PDF থেকে "পড়ার মতো" text বের করা এবং ছোট ছোট অংশে ভাগ করা |
| 2 | Retrieval | ইউজারের প্রশ্নের সাথে সবচেয়ে relevant অংশটা document থেকে খুঁজে বের করা |
| 3 | Generation | খুঁজে পাওয়া অংশ + প্রশ্ন — এই দুটো দিয়ে LLM দিয়ে সঠিক, স্বাভাবিক উত্তর তৈরি করানো |

### Step 2 — Check-in Reflection

**প্রশ্ন:** তিনটার মধ্যে কোনটা সবচেয়ে কঠিন মনে হয়?

**আমার উত্তর ছিল:** Document Understanding + Retrieval ঠিক থাকলে Generation সহজ হয়ে যাবে।

**Key takeaway (নতুন শেখা):**
- ✅ সত্যি অংশ: এটা RAG-এর একটা core principle ধরেছে — **"Garbage In, Garbage Out"**। Retrieval-এর quality পুরো system-এর "ceiling" ঠিক করে দেয়।
- ⚠️ Nuance: Retrieval ঠিক থাকলেও Generation-এ ভুল হতে পারে — Hallucination (context ignore করে ভুল বলা), Multi-chunk synthesis সমস্যা, Prompt design-এর প্রভাব, "জানি না" honestly বলতে পারা। তাই Retrieval ঠিক থাকা মানে Generation "automatic easy" না, বরং ভালো answer পাওয়ার "সম্ভাবনা তৈরি হয়" — সেটা reliable করতে Phase 5-এ আলাদা technique (prompt engineering, grounding, guardrails) লাগবে।

---

## ✅ Phase 2: Document Understanding (PDF Ingestion)

**Status:** সম্পূর্ণ (GitHub-এ push করা হয়েছে)

### Step 1 — Project Environment Setup

**কেন দরকার:**
- **venv (virtual environment)** — এই project-এর library অন্য project-এর সাথে conflict না করার জন্য isolated environment
- **git init** — শুরু থেকেই version control, পরে GitHub-এ পুরো history track করা যাবে
- **Folder structure** — পরে backend/frontend যোগ হলে সব গোছানো থাকবে

**যা করা হলো:**
```
mkdir pdf-rag-chatbot && cd pdf-rag-chatbot
python3 --version        # → Python 3.13.7
python -m venv venv      # virtual environment তৈরি
git init                 # git repository initialize
source venv/bin/activate # venv activate (prompt-এ (venv) দেখা গেলে confirm)
```

### Step 2 — PDF Extraction Library বাছাই

**কেন Library লাগে:** PDF একটা complex binary format (text, font, layout সব encoded) — scratch থেকে parse করা অবাস্তব, তাই তৈরি library ব্যবহার করা হয়।

**Options বিবেচনা করা হয়েছিল:**

| Library | সুবিধা | অসুবিধা |
|---|---|---|
| PyPDF (pypdf) | সহজ, lightweight | Complex layout-এ text এলোমেলো হতে পারে |
| pdfplumber | Table extraction ভালো | তুলনামূলক ধীর |
| **PyMuPDF (fitz)** ✅ চূড়ান্ত সিদ্ধান্ত | দ্রুত, complex layout ভালো handle করে, production-এ জনপ্রিয় | সামান্য বেশি setup |

```
pip install pymupdf   # → pymupdf-1.28.2 successfully installed
```

### Step 3 — প্রথম Text Extraction Script

**Test data:** `data/resume.pdf`

**Script (`extract.py`) — লাইন বাই লাইন যুক্তি:**

| কোড অংশ | কাজ |
|---|---|
| `import fitz` | PyMuPDF library script-এ আনা |
| `fitz.open(path)` | PDF-কে একটা "document object"-এ রূপান্তর (এর ভিতরেই সব page/text/structure থাকে) |
| `for page in doc` | প্রতিটা page নিয়ে loop |
| `page.get_text()` | সেই page-এর raw readable text বের করা |

```python
import fitz

doc = fitz.open("data/resume.pdf")

for page_num, page in enumerate(doc):
    text = page.get_text()
    print(f"--- Page {page_num + 1} ---")
    print(text)
```

চালানো হলো: `python3 extract.py`

**ফলাফল:** ✅ সফলভাবে সব text terminal-এ এসেছে।

**গুরুত্বপূর্ণ পর্যবেক্ষণ:** Extracted text একটা **continuous block** — কোনো structure (heading, bullet, section আলাদা) নেই। এটাই পরের Step (Chunking)-এর দরকারের কারণ।

### Step 4 — Chunking Strategy

**সমস্যা:** পুরো page/document-কে একক block হিসেবে ব্যবহার করলে, একটা নির্দিষ্ট প্রশ্নের জন্য পুরো অপ্রয়োজনীয় content-সহ retrieve হয়ে যায় — noise বাড়ে, context window অপচয় হয়।

**Strategy বাছাই:** Fixed-size vs Structure-aware vs Semantic — এই তিনটা বিবেচনা করে **Hybrid/Recursive chunking** বেছে নেওয়া হয়েছে (paragraph দিয়ে ভাগ করার চেষ্টা → দরকার হলে আরও ছোট করা → overlap যোগ করা)। এটাই industry-তে সবচেয়ে বেশি ব্যবহৃত (LangChain-এর `RecursiveCharacterTextSplitter`)। কারণ: PyMuPDF-এর raw extraction-এ heading/structure signal থাকে না, তাই pure structure-aware সম্ভব না।

Library: `pip install langchain-text-splitters`। Config: `chunk_size=200, chunk_overlap=30` (ছোট test PDF-এর জন্য)।

### Step 5 — প্রথম Chunking Run ও সমস্যা ধরা

প্রথম try-তে **overlap কাজ করেছে** (section heading দুই chunk-এ repeat), কিন্তু একটা সমস্যাও দেখা গেছে — শব্দ মাঝপথে ভেঙে যাচ্ছিল (যেমন "software" / "development" আলাদা chunk-এ)।

**কারণ:** PDF-এর line-wrap newline (`\n`)-কে splitter ভুলভাবে paragraph-break ধরে নিচ্ছিল।

### Step 6 — Text Cleaning

**সমাধান:** Regex (`re.sub`) দিয়ে single newline (line-wrap) কে space-এ বদলানো, কিন্তু real paragraph break (`\n\n`) অক্ষুণ্ণ রাখা — প্যাটার্ন: `re.sub(r'(?<!\n)\n(?!\n)', ' ', text)`। এর ফলে শব্দ ভাঙা প্রায় বন্ধ হয়ে গেছে (PDF-এর নিজস্ব hyphen-break যেমন "Mon-goDB" এখনো আছে — known limitation, Phase 6-এ দরকার হলে দেখা হবে)।

সাথে `import fitz` → `import pymupdf as fitz` (deprecation warning fix)।

### Step 7 — Refactoring (Reusable Function)

**কেন:** এই "load + chunk" logic পরের প্রতিটা Phase-এ (Embedding থেকে Backend পর্যন্ত) বারবার লাগবে — তাই Separation of Concerns অনুযায়ী আলাদা ফাইলে function হিসেবে রাখা হলো।

- **`ingest.py`** → `load_and_chunk(pdf_path, chunk_size=200, chunk_overlap=30)` function (মূল logic)
- **`extract.py`** → শুধু `from ingest import load_and_chunk` করে ব্যবহার করে (script ছোট হয়ে গেছে)

**Module import shikha:** Python কীভাবে অন্য `.py` ফাইলকে "module" হিসেবে খুঁজে, execute করে, আর নির্দিষ্ট function ধার নেয় — এটা বোঝা হয়েছে।

### Step 8 — GitHub Push (Housekeeping)

- `.gitignore` বানানো হয়েছে (`venv/`, `__pycache__/` — কখনো push হয় না, কারণ environment-specific/auto-generated/reproducible)
- `requirements.txt` (`pip freeze`) — reproducibility-র জন্য
- `README.md` — project-এর "front door", status + setup + structure
- **Personal data সিদ্ধান্ত:** `resume.pdf`-এ phone/email থাকা সত্ত্বেও ইউজার সচেতনভাবে as-is রাখার সিদ্ধান্ত নিয়েছে
- Git workflow শেখা হয়েছে: `git status` (কী track হচ্ছে) → `git add .` (staging area) → `git commit -m "..."` (permanent snapshot + message) → GitHub-এ empty repo বানানো → `git remote add origin <url>` → `git push -u origin main`
- **Scope decision:** Pipeline PDF-only থাকবে; Google Docs/Slides ব্যবহার করতে চাইলে user "Export as PDF" করে নেবে (একই pipeline reuse, নতুন কোড লাগবে না)। SlideShare বাদ (API কার্যত বন্ধ)।

---

## ✅ Phase 3: Embedding (Text → Vector)

**Status:** সম্পূর্ণ

### Step 1 — গাণিতিক ভিত্তি

Embedding = text কে $\vec{v} \in \mathbb{R}^n$ vector-এ রূপান্তর (neural network দিয়ে), যেখানে semantically কাছাকাছি টেক্সট কাছাকাছি vector পায়।

**Cosine Similarity:** $\frac{\vec{A}\cdot\vec{B}}{\|\vec{A}\|\|\vec{B}\|}$ — মান $-1$ থেকে $1$। Euclidean distance না নিয়ে cosine নেওয়া হয় কারণ এটা vector-এর **magnitude ignore করে শুধু direction/angle** মাপে (text length-এর প্রভাব এড়ানো যায়)।

**Hands-on check (2D toy example):** A=(1,0), B=(0.9,0.1), C=(-1,0) → হাতে-কলমে হিসাব: cos(A,B)≈0.994, cos(A,C)=−1। **শেখা:** Cosine "সংখ্যার মিল" মাপে না, **দিক (sign/angle)** মাপে — বিপরীত দিকের vector সবচেয়ে কম similar, এমনকি coordinate ছোট হলেও।

### Step 2 — Embedding Provider বাছাই

Anthropic নিজে কোনো embedding model অফার করে না, **Voyage AI**-কে recommend করে RAG pipeline-এর জন্য। মডেল বাছাই: **`voyage-4-lite`** ($0.02/M token, প্রথম ২০০M token ফ্রি) — সস্তা ও যথেষ্ট ভালো learning-এর জন্য।

### Step 3-4 — API Key নিরাপদে রাখা

- Voyage AI dashboard থেকে API key generate করা হয়েছে
- `.env` ফাইলে `VOYAGE_API_KEY=...` রাখা হয়েছে (code-এ hardcode না করে)
- **জরুরি:** `.env`-কে `.gitignore`-এ যোগ করা হয়েছে **কোনো কোড লেখার আগেই**, যাতে key কখনো commit/push না হয়

### Step 5 — Libraries

`pip install python-dotenv voyageai numpy` — `.env` পড়ার জন্য, Voyage API call করার জন্য, আর vector math (dot product, norm)-এর জন্য।

### Step 6 — প্রথম API Call ও Debugging

`embed_test.py` — `load_dotenv()` → `os.environ[...]` দিয়ে key নেওয়া → `voyageai.Client(...)` → `vo.embed([...], model=..., input_type="document")`।

**সমস্যা এসেছিল:** `AuthenticationError: Provided API key is invalid` — ভুল key copy হয়েছিল। **সমাধান:** `check_env.py` দিয়ে "masked debug" (পুরো key না দেখিয়ে শুধু length, প্রথম/শেষ কয়েকটা character, leading/trailing space check) — এটা production-standard secret-debugging পদ্ধতি।

**ফলাফল:** `voyage-4-lite` প্রতিটা টেক্সটকে **1024-dimensional vector**-এ রূপান্তর করে।

### Step 7 — Cosine Similarity বাস্তব ডেটায় Verify

৩টা sentence embed করে similarity মাপা হয়েছে:
- "competitive programming" ↔ "algorithmic problems" → **0.815** (কাছাকাছি অর্থ)
- "competitive programming" ↔ "weather" → **0.442** (ভিন্ন অর্থ)

Hypothesis অনুযায়ী ফলাফল মিলেছে — গণিত বাস্তবে semantic difference ধরতে পারছে, এটাই confirm হলো।

**নতুন শেখা:** `input_type="document"` (retrieve হওয়ার টেক্সট, যেমন PDF chunk) vs `input_type="query"` (খোঁজার টেক্সট, যেমন user প্রশ্ন) — সামান্য ভিন্ন internal representation, matching accuracy বাড়ায়।

### Step 8 — আসল PDF Chunks Embed করা (Pipeline সংযুক্তি)

`embed_chunks.py` — Phase 2-এর `ingest.py`-এর `load_and_chunk()` reuse করে resume.pdf-এর সব chunk **batch হিসেবে** (একটা API call-এ) embed করা হয়েছে।

**ফলাফল:** ২৮টা chunk → ২৮টা vector, প্রতিটা 1024-dimension। ✅ Consistency confirmed.

**পরবর্তী প্রয়োজন (Phase 4-এর সূত্রপাত):** এই মুহূর্তে vector গুলো শুধু script চলাকালীন memory-তে আছে, script শেষ হলে হারিয়ে যায় — স্থায়ীভাবে সংরক্ষণ ও দ্রুত খোঁজার (search) ব্যবস্থা করাই Phase 4-এর কাজ।

---

## ✅ Phase 4: Vector Storage & Retrieval

**Status:** সম্পূর্ণ

### Step 1 — কেন Vector Database লাগবে

২৮টা chunk-এর জন্য brute-force loop-ও কাজ করত, কিন্তু বাস্তব স্কেলে ($10^5$–$10^6$ chunk) এটা $O(N)$ — প্রতিটা query-তে সব vector-এর সাথে তুলনা, যা ধীর হয়ে যায়।

**সমাধান — ANN (Approximate Nearest Neighbor):** Real vector database internally **HNSW (Hierarchical Navigable Small World)** নামের multi-layer graph structure ব্যবহার করে, যেটা পুরো dataset স্ক্যান না করেই প্রায় $O(\log N)$-এর কাছাকাছি সময়ে nearest match খুঁজে দেয়। নিজে implement না করে ready-made library ব্যবহার করা হয়েছে।

**বাছাই: ChromaDB** — local, persistent (disk-এ save থাকে), Python-friendly, পরে বড় স্কেলে দরকার হলে Pinecone/Weaviate-এ migrate করা সহজ (concept একই থাকে)।

### Step 2 — Storage (`store_vectors.py`)

`chromadb.PersistentClient(path="./chroma_db")` + `get_or_create_collection()` + `collection.add(ids=..., documents=..., embeddings=...)` — Phase 2 (chunk) ও Phase 3 (embedding)-এর output একসাথে জোড়া লাগিয়ে ChromaDB-তে সংরক্ষণ। ফলাফল: ২৮টা chunk সফলভাবে persist হয়েছে।

### Step 3 — প্রথম Retrieval ও একটা গুরুত্বপূর্ণ Bug Fix

Query করার সময় প্রশ্নও embed করতে হয় (`input_type="query"`, document-এর বিপরীতে), তারপর `collection.query(query_embeddings=..., n_results=k)`।

**সমস্যা ধরা পড়েছিল:** প্রথম query-তে distance ছিল ($0.83$–$1.01$), যা cosine similarity-র expected range ($-1$ থেকে $1$) এর সাথে মিলছিল না। Search করে জানা গেল — **ChromaDB-র default distance metric হলো `l2` (Squared Euclidean), `cosine` না** — আমরা explicitly specify করিনি।

**শেখা (production lesson):** Library-র silent default-এর উপর নির্ভর না করে, যা বুঝি/চাই সেটা explicitly configure করা উচিত।

**Fix:** পুরনো `chroma_db` মুছে, `configuration={"hnsw": {"space": "cosine"}}` দিয়ে নতুন করে collection বানানো হয়েছে। এরপর distance range ঠিক ($0$–$2$, cosine distance $=1-\text{cosine similarity}$) এসেছে এবং Phase 3-এর manual হিসাবের সাথে সরাসরি তুলনাযোগ্য হয়েছে।

**Test query ফলাফল:** "What programming languages does this person know?" → সঠিকভাবে SKILLS section সবচেয়ে relevant হিসেবে এসেছে (distance 0.417, cosine similarity ≈ 0.583)।

### Step 4 — Reusable `retrieval.py` Module

**ধারণা — Build vs Search, দুইটা ভিন্ন কাজ:**

| কাজ | কখন | খরচ |
|---|---|---|
| `build_index()` | একবার, নতুন PDF এলে | ধীর (পুরো PDF embed করা লাগে) |
| `search()` | প্রতিটা user-question-এ | দ্রুত (শুধু ছোট query embed + instant DB lookup) |

এই আলাদাকরণ গুরুত্বপূর্ণ — Backend (Phase 7)-এ প্রতিটা প্রশ্নে ভুল করে পুরো PDF আবার embed করলে ভয়ানক ধীর/ব্যয়বহুল হয়ে যাবে।

`retrieval.py` এখন `ingest.py` (Phase 2) ও Voyage embedding (Phase 3)-এর সাথে মিলিয়ে সম্পূর্ণ pipeline-এর প্রথম **reusable, end-to-end retrieval interface** তৈরি করেছে — পরের Phase (Generation) থেকে সরাসরি `from retrieval import search` করে ব্যবহার করা যাবে।

**Git housekeeping:** `chroma_db/` (regenerable derived data) `.gitignore`-এ যোগ করা হয়েছে।

---

## ✅ Phase 5: Generation (LLM Integration)

**Status:** সম্পূর্ণ

### Step 1 — Prompt Engineering: System vs User Separation

**Naive prompt-এর সমস্যা:** কোনো নির্দেশনা ছাড়া শুধু chunk+question জুড়ে দিলে Hallucination-এর ঝুঁকি থাকে (context-এ না থাকা তথ্য বানিয়ে বলা)।

**উন্নত pattern (search করে production practice অনুযায়ী confirm করা):**
- **`system` prompt** — ভূমিকা ও নিয়ম (grounding rule: শুধু context থেকে উত্তর দাও, না থাকলে honestly বলো)
- **`user` message** — Numbered/labeled sources (`[Source 1]`, `[Source 2]`...) + প্রশ্ন

**Numbered sources কেন:** Citation সক্ষম করে ("Based on Source 1...") — answer-এর verifiability বাড়ায়, hallucination কমায়।

**সততার নোট:** কোনো prompt "চূড়ান্ত সেরা" নয় — measurable ভাবে তুলনা করাই Phase 6 (Evaluation)-এর কাজ; এটা একটা প্রমাণিত ভালো starting point।

### Step 2 — প্রথম Provider বাছাই: Anthropic (Claude)

`anthropic` library install → `generation.py`-তে `client.messages.create(model="claude-sonnet-5", system=..., messages=[...])` লেখা হয়েছে।

**Debugging (পরিচিত pattern, নিজে সমাধান করা হয়েছে):** `AuthenticationError` — `.env`-এ key copy করার সময় ভুলবশত একটা অতিরিক্ত অক্ষর (`ssk-ant-` এর বদলে `sk-ant-`) ঢুকে গিয়েছিল। আগে শেখা masked-debug script (`check_env.py`, এবার loop দিয়ে একাধিক key check করার জন্য extend করা হয়েছে) দিয়ে ধরা হয়েছে ও ঠিক করা হয়েছে।

### Step 3 — বাধা: Billing/Credit সমস্যা

Auth ঠিক হওয়ার পর নতুন error: `credit balance too low`। **শেখা:** Anthropic API একটা **prepaid credit system** (claude.ai চ্যাটের থেকে আলাদা) — ব্যবহারের আগে কমপক্ষে $5 credit কিনতে হয়, কোনো ongoing free tier নেই। Voyage AI-এর ফ্রি-tier থেকে এটা আলাদা।

### Step 4 — সিদ্ধান্ত: Gemini API-তে Pivot (বাজেট constraint-এর কারণে)

এই মুহূর্তে $5 খরচ করার সামর্থ্য না থাকায়, বিকল্প খতিয়ে দেখা হয়েছে:

| | Anthropic (Claude) | Gemini (Google) |
|---|---|---|
| খরচ | Prepaid credit (min $5) | সত্যিকারের ফ্রি tier |
| Privacy | Paid → data training-এ ব্যবহার হয় না | Free tier-এ data Google ব্যবহার করতে পারে |

**সিদ্ধান্ত:** বাজেট constraint-এর কারণে **Gemini free tier**-এ (Google AI Studio, কোনো card লাগে না) সচেতনভাবে (privacy trade-off জেনে) switch করা হয়েছে।

**Architecture-এর সুবিধা প্রমাণিত হলো:** যেহেতু `generation.py` একটা আলাদা module, শুধু এই একটা ফাইল বদলাতে হয়েছে — `retrieval.py`/`ingest.py` অপরিবর্তিত। এমনকি `generate_answer(question, chunks)` function-এর **signature-ও অপরিবর্তিত** রাখা হয়েছে, ফলে `test_generation.py`-তে **একটাও লাইন বদলাতে হয়নি** — Separation of Concerns-এর বাস্তব প্রমাণ।

**নতুন setup:** `google-genai` library, `GEMINI_API_KEY` (তৃতীয় key, `.env`-এ), `client.models.generate_content(model="gemini-flash-latest", contents=..., config=types.GenerateContentConfig(system_instruction=...))`।

**একটা transient বাধা:** প্রথম চেষ্টায় `503 UNAVAILABLE` (Google server busy, আমাদের ভুল না) — আবার চেষ্টা করাতে কাজ করেছে। **শেখা:** HTTP status code দিয়ে error-এর ধরন চেনা (401=auth, 400=request/billing, 503=temporary server issue, retry করাই সমাধান)।

### Step 5 — সফল End-to-End Test

**Test ১ (উত্তর context-এ আছে):** "What programming languages does this person know?" → সঠিক উত্তর + **"Based on Source 1"** citation — সঠিকভাবে কাজ করেছে।

**Test ২ (Grounding/Hallucination check, উত্তর context-এ নেই):** "What is this person's expected salary?" → **"This information is not available in the document."** — System prompt-এর grounding rule সফলভাবে কাজ করেছে, কোনো তথ্য বানানো হয়নি।

**সম্পূর্ণ pipeline নিশ্চিত হলো:**
```
Question → Voyage AI (embed) → ChromaDB (retrieve) → Gemini (generate, grounded) → Answer
```

---

## ✅ Phase 6: Evaluation

**Status:** সম্পূর্ণ

### Step 1 — কী ও কেন Measure করা হলো

"মনে হচ্ছে ভালো কাজ করছে" যথেষ্ট না — ভবিষ্যতে কোনো পরিবর্তন (chunk size, model ইত্যাদি) উন্নতি না অবনতি আনলো, সেটা বোঝার জন্য একটা সংখ্যাগত baseline দরকার। দুইটা স্তর মাপা হয়েছে:
- **Retrieval:** Recall@k (সরলীকৃত Hit Rate@k, কারণ প্রতিটা প্রশ্নের একটাই মূল সঠিক chunk)
- **Generation:** Answer accuracy (manual review)

### Step 2 — Golden Test Set

৫টা প্রশ্ন, resume-এর ৫টা ভিন্ন section (Skills, Education, Work Experience, Projects, Competitive Programming) থেকে, প্রতিটার সাথে একটা `expected_keyword` — retrieved chunk-এ এই keyword থাকলে "hit" ধরা হয়।

### Step 3 — `evaluate.py` ও একটা নতুন বাধা (Rate Limit)

Script structure: প্রতিটা প্রশ্নে `search()` → keyword-hit check → `generate_answer()` → ফলাফল print।

**নতুন সমস্যা:** `voyageai.error.RateLimitError` — payment method যোগ না করা Voyage AI account-এ rate limit কৃত্রিমভাবে কম (৩ RPM)। **শেখা — Token quota ≠ Rate limit** (দুইটা ভিন্ন সীমাবদ্ধতা): quota = মোট কত ডেটা, rate limit = প্রতি মিনিটে কতগুলো request। **সমাধান:** `time.sleep(21)` দিয়ে প্রতিটা request-এর মাঝে delay (production-এ external API respect করে rate-limiting মেনে চলার practice)।

### Step 4 — ফলাফল

- **Retrieval Recall@3: 100% (5/5)**
- **Answer Accuracy: 100% (5/5, manually verified)** — সব factually সঠিক; একটা উত্তরে scope-এর বাইরের বাড়তি তথ্য ছিল (ভুল না, কিন্তু conciseness-এর দিক থেকে flaw)
- Grounding এখানেও প্রমাণিত: Codeforces প্রশ্নে model honestly বলেছে "current rating explicitly specified না" (বানিয়ে বলেনি)

**README.md**-এ Evaluation Results section যোগ করা হয়েছে — এখন প্রজেক্টে একটা **measured, specific claim** আছে ("Recall@3: 100%, 5-question test set"), যেটা vague "95%+ accuracy" claim-এর চেয়ে অনেক বেশি credible ও honest।

### Note — ভবিষ্যতের জন্য: Exam-style Answer Format (Lecture Slide ব্যবহারের সময়)

ব্যবহারকারী জানিয়েছে PDF কখনো lecture slide হতে পারে, যেখানে exam-style (৫ নম্বরের) উত্তর দরকার — resume-এর মতো ছোট factual answer না, বরং ~১০০-১৮০ শব্দের গোছানো, ব্যাখ্যাসহ answer, প্রয়োজনে ছোট example, আর PDF-এ না থাকা **সত্যিই critical** তথ্য শুধু বিরল ক্ষেত্রে আলাদা "Note (beyond the slides):" লাইনে (default না, merged/blended না — grounding guarantee অক্ষুণ্ণ রাখতে)।

**Refined System Prompt (প্রস্তুত, কিন্তু এখনো implement/test করা হয়নি — আসল lecture PDF হাতে না থাকায়):**

```python
SYSTEM_PROMPT = """You are a study assistant that helps a student prepare exam-style
answers from their lecture slides.

Grounding rules:
- Base your answer primarily on the numbered sources below.
- Only if something critically important is missing and the answer would be
  incomplete without it, add ONE brief line at the end starting with
  "Note (beyond the slides):" — do this sparingly, not by default.
  Never blend outside knowledge into the main answer as if it came from the
  sources.
- When relevant, mention which source number supports each point.

Answer style:
- Write a well-organized exam-answer (roughly 100-180 words): clear
  structure, one idea flowing into the next, like a student writing a
  5-mark answer.
- Add a short example only if it makes a concept concretely clearer.
- Keep it readable: short paragraphs or a few labeled points — not one
  dense block, not a bare list.
"""
```

**পরবর্তী পদক্ষেপ (যখন lecture PDF হাতে আসবে):** এই prompt দিয়ে `generation.py` আপডেট করে টেস্ট করা, আর হয়তো retrieval `k` বাড়ানো বিবেচনা করা (exam-answer-এ একাধিক bullet/slide থেকে তথ্য synthesize করা লাগতে পারে)।

---

## ✅ Phase 7: Backend API Layer (FastAPI)

**Status:** সম্পূর্ণ

### Step 1 — Backend/API কী (কোনো কোড ছাড়াই concept)

এতদিন script একবার চলে বন্ধ হয়ে যেত (নিজে terminal-এ চালিয়ে দেখা)। কিন্তু frontend user Python জানে না, script চালাতে পারবে না — তাই আমাদের pipeline-কে একটা **সবসময়-চালু server**-এ রূপান্তর করা দরকার, যেটা browser থেকে request নেবে, RAG logic চালাবে, response ফেরত দেবে। **FastAPI** বেছে নেওয়া হয়েছে — Python-based, existing function reuse করা সহজ, industry-standard।

### Step 2 — প্রথম Server ("Hello World")

নতুন concept: **Decorator** (`@app.get("/")`) — "এই URL-এ request এলে নিচের function চালাও"। `fastapi` (নিয়ম সংজ্ঞায়িত করা) + `uvicorn` (আসল ইঞ্জিন যেটা চালায়) — দুইটার ভূমিকা আলাদা।

`uvicorn app:app --reload` দিয়ে চালিয়ে browser-এ verify করা হয়েছে (`/` এবং auto-generated `/docs` — interactive API documentation, testing tool হিসেবেও ব্যবহৃত হবে)।

### Step 3 — আসল RAG Endpoint

**নতুন concept:**
- **`GET` vs `POST`** — তথ্য "চাওয়া" (GET) vs ডেটা পাঠিয়ে "action" করানো (POST)
- **Pydantic `BaseModel`** — incoming request-এর "blueprint" সংজ্ঞায়িত করা (`QuestionRequest`), automatic validation

`POST /ask` endpoint তৈরি — internally আমাদের আগে থেকে বানানো, পরীক্ষিত `search()` ও `generate_answer()` reuse করে। `/docs`-এর "Try it out" দিয়ে সফলভাবে টেস্ট করা হয়েছে।

### Step 4 — Error Handling (Production-critical বাগ ধরা পড়েছে ও ঠিক হয়েছে)

Rate-limit/quota error (Voyage + Gemini দুটোই একসাথে) আসায় প্রথমবার **raw Python traceback সরাসরি user-কে দেখানো হচ্ছিল** — এটা production-এ কখনো গ্রহণযোগ্য না (confusing + internal code leak করে)।

**সমাধান — `try/except` + `HTTPException`:**
- User পায়: পরিষ্কার, নিরাপদ message (`503`, "AI service temporarily unavailable")
- Developer (server log-এ) পায়: আসল technical কারণ (`print()` দিয়ে)

**শেখা:** User-facing message ও developer-facing log আলাদা রাখা — একটা core production pattern। Live-test করে (quota exhausted অবস্থায়) confirm করা হয়েছে এটা ঠিকমতো কাজ করছে।

### Step 5 — CORS

**Concept:** Browser-এর security নিয়ম — একটা origin (React dev server) থেকে অন্য origin (FastAPI, `localhost:8000`)-এ by default request block করা হয়, যদি না server explicitly অনুমতি দেয়।

`CORSMiddleware` যোগ করা হয়েছে (Frontend তৈরির আগেই, যাতে পরে integration-এ বাধা না আসে)। শুরুতে `localhost:3000` ধরা হয়েছিল (পুরোনো Create-React-App tutorial-এর default), কিন্তু **Vite-এর আসল default port `5173`** — তাই `allow_origins=["http://localhost:5173"]` করা হয়েছে। **শেখা:** অনুমান না করে আসল port terminal output থেকে দেখে নিতে হয়।

---

## ✅ Phase 8: Frontend (React)

**Status:** সম্পূর্ণ (live-verified: upload → question → সঠিক answer, এবং error অবস্থায় লাল error message)

### Step 1 — প্রাথমিক ধারণা (React একদম নতুন হওয়ায় from-scratch)

| শব্দ | ধারণা |
|---|---|
| Node.js | Browser-এর বাইরে JavaScript চালানোর engine |
| npm | JavaScript-এর package manager (Python-এর `pip`-এর সমতুল্য) |
| React | UI Component দিয়ে বানানোর library |
| Vite | Modern, দ্রুত build tool — project scaffold করতে ব্যবহৃত |

`node -v` / `npm -v` দিয়ে আগে থেকেই install থাকা (v20.19.4 / 9.2.0) confirm করা হয়েছে।

### Step 2 — Project তৈরি ও গঠন বোঝা

`npm create vite@latest frontend -- --template react` (ESLint বেছে নেওয়া হয়েছে, Oxlint-এর চেয়ে বেশি established/documented হওয়ায়)। `npm run dev` দিয়ে dev server চালানো শেখা হয়েছে (concept-গতভাবে backend-এর `uvicorn --reload`-এর সমতুল্য — **Hot Reload**)।

**Project আলাদা রাখা:** Backend (`pdf-rag-chatbot/`) ও Frontend (`pdf-rag-chatbot/frontend/`) সম্পূর্ণ আলাদা folder, আলাদা world — command ভুল directory থেকে চালানোর ভুল একবার হয়েছিল ও ঠিক করা হয়েছে।

### Step 3 — `App.jsx` বোঝা ও পরিষ্কার করা

নতুন concept: **Component** (UI-এর স্বয়ংসম্পূর্ণ অংশ), **JSX** (JS-এর ভিতরে HTML-এর মতো syntax), **Fragment** (`<>...</>`), **`export default`**। Vite-এর default demo-template মুছে একটা ন্যূনতম starting component রাখা হয়েছে।

### Step 4 — Input Box (State-চালিত)

**নতুন, সবচেয়ে গুরুত্বপূর্ণ concept: `useState`** — state বদলালে UI স্বয়ংক্রিয়ভাবে re-render হয়। **Controlled Component** pattern (`value` + `onChange`) দিয়ে input বানানো হয়েছে।

### Step 5 — Backend Connection (মূল milestone)

**নতুন concept:** `fetch` (browser-এর built-in HTTP client), `async/await` (network delay-এর সময় পুরো UI freeze না করা)। `handleAsk()` function দিয়ে `POST /ask`-এ request পাঠানো, response থেকে answer বের করে state-এ রাখা।

**একটা গুরুত্বপূর্ণ bug ধরা পড়েছে ও শেখা হয়েছে:** `fetch` HTTP error status (৪xx/৫xx) পেলে নিজে থেকে exception ছোঁড়ে না — `response.ok` ম্যানুয়ালি check করতে হয়। এই check বাদ থাকায় backend-এর `503` error silently "কিছুই না দেখানো"-তে পরিণত হচ্ছিল। **সমাধান:** `response.ok` check + আলাদা `error` state + `try/catch` (network-level ব্যর্থতার জন্য) — যোগ করার পর backend-এর `HTTPException` message স্পষ্টভাবে UI-তে (লাল রঙে) দেখানো শুরু করেছে। **Live verify করা হয়েছে:** Gemini quota-exhausted অবস্থায় সঠিকভাবে "AI service temporarily unavailable" দেখিয়েছে, silent failure হয়নি — এটাই সম্পূর্ণ error-handling chain (Backend → Frontend) প্রমাণ করে।

### Step 6 — UX Safety Improvements

- Enter-key দিয়ে submit (`onKeyDown` + `e.key === 'Enter'`)
- Loading অবস্থায় button `disabled` — বারবার ক্লিকে অতিরিক্ত (rate/quota-সীমিত) API call এড়ানো
- খালি/শুধু-space প্রশ্ন আটকানো (`question.trim()`)

### Step 7 — Visual Design

ডিফল্ট Vite styling সরিয়ে ইচ্ছাকৃত, "reading/study tool"-উপযোগী palette বসানো হয়েছে (উষ্ণ paper background, forest-green accent, serif heading + sans body) — generic নীল-বাটন SaaS look এড়িয়ে। `className` দিয়ে JSX-কে CSS-এর সাথে যুক্ত করা শেখা হয়েছে।

---

## ✅ Addendum: PDF Upload Feature

**Status:** সম্পূর্ণ (live-verified)

### কেন দরকার ছিল

এতদিন app শুধু একটা hard-coded PDF (`resume.pdf`)-এর উপর কাজ করত। একটা আসল "PDF chatbot"-এ user নিজের PDF আপলোড করতে পারা উচিত — তাই `/upload` endpoint ও frontend-এ upload UI যোগ করা হয়েছে।

### কী কী যোগ হয়েছে

- **`POST /upload` (backend):** FastAPI-র `UploadFile` + `File(...)` দিয়ে multipart file গ্রহণ করে। ফাইলটা `shutil.copyfileobj` দিয়ে ডিস্কে সেভ করে `build_index()` চালায় (chunk → embed → Chroma-তে সংরক্ষণ)।
- **নতুন dependency: `python-multipart`** — এটা ছাড়া FastAPI file-upload (multipart/form-data) parse করতে পারে না। এটা না থাকলে server চালু হওয়ার সময়ই `RuntimeError: Form data requires "python-multipart" to be installed` আসে। সমাধান: `pip install python-multipart`, তারপর `requirements.txt` আপডেট।
- **`build_index()`-এর "delete-then-recreate" logic:** নতুন PDF আপলোড হলে পুরোনো collection মুছে নতুন করে বানানো হয়, যাতে দুই document-এর chunk মিশে না যায়।
- **Frontend (`App.jsx`):** `FormData` দিয়ে file পাঠানো। **গুরুত্বপূর্ণ:** `Content-Type` header হাতে সেট করা যাবে না — browser নিজে `multipart/form-data` ও boundary সেট করে। এছাড়া `file`, `uploadStatus`, `uploading` state যোগ হয়েছে।

---

## 🐞 একটা পূর্ণাঙ্গ Debugging Journey (Portfolio-এর জন্য সবচেয়ে ভালো গল্প)

Upload feature বানানোর পর একটা আসল, ঘন (dense) academic PDF (একটা team thesis proposal) দিয়ে live টেস্ট করতে গিয়ে পরপর দুটো আলাদা bug ধরা পড়ে। দুটোই **retrieval-configuration layer**-এর সমস্যা ছিল — LLM-এর নয়।

### Bug 1 — Collection Name Mismatch (ভুল document থেকে উত্তর)

**Symptom:** নতুন PDF আপলোড করে "Successfully indexed 100 chunks" দেখানো সত্ত্বেও প্রশ্নের উত্তর আসছিল পুরোনো `resume.pdf` থেকে। প্রশ্ন ছিল "এই project-এ ৫ জন member কারা?" — কিন্তু উত্তর অসম্পূর্ণ ও অপ্রাসঙ্গিক।

**ধরা পড়ার সূত্র:** উত্তরের ভিতরে resume-এর একটা হুবহু বাক্য দেখা গিয়েছিল — যেটা থাকার কথা না। অর্থাৎ retrieval ভুল জায়গা থেকে chunk আনছে।

**Root cause:**
```python
def build_index(pdf_path, collection_name="document_chunks"):   # নতুন default
def search(query, collection_name="resume_chunks", k=3):        # পুরোনো, ভুলে থেকে গেছে
```
Index হচ্ছিল `document_chunks`-এ, কিন্তু search হচ্ছিল পুরোনো `resume_chunks`-এ। `cat retrieval.py` চালিয়ে hypothesis নিশ্চিত করা হয়েছে।

**Fix:** `search()`-এর default `"document_chunks"`-এ মিলিয়ে দেওয়া।

**শেখা (Prevention):** একই মান দুই জায়গায় hard-code করলে একদিন mismatch হবেই। সমাধান — একটা single-source-of-truth constant:
```python
COLLECTION_NAME = "document_chunks"   # ফাইলের উপরে, দুই function-ই এটা ব্যবহার করবে
```

### Bug 2 — Chunk Size ও `k` Document-এর ঘনত্বের সাথে মেলেনি

**Symptom:** Bug 1 ঠিক করার পরও ৫ জন member-এর পুরো তালিকা আসছিল না।

**Root cause:** `chunk_size=200` ছিল ছোট একটা resume-এর জন্য tune করা। কিন্তু thesis proposal-এর team-members table-টা ২৪০+ character-এর একটা block — ২০০-এর chunk-এ সেটা মাঝখানে ভেঙে যাচ্ছিল। তার উপর পুরো document ~১০০ chunk-এ ভাগ হওয়ায় `k=3` দিয়ে ভাঙা দুই অংশ একসাথে retrieve হচ্ছিল না।

**Fix:**

| Parameter | আগে | পরে | ফাইল |
|---|---|---|---|
| `chunk_size` | 200 | 600 | `ingest.py` |
| `chunk_overlap` | 30 | 100 | `ingest.py` |
| `k` | 3 | 5 | `retrieval.py` (`search()`) |

**বাধ্যতামূলক পরবর্তী ধাপ — Re-upload:** পুরোনো `chroma_db`-এর data পুরোনো chunk_size দিয়ে বানানো, তাই কোড বদলালেই হবে না; PDF আবার আপলোড করে index rebuild করতে হয়েছে। ফলাফল: ১০০ chunk → **৩৪ chunk**, এবং পুনরায় প্রশ্ন করলে ৫ জন member-এর নাম ও ID সব সঠিক এসেছে। ✅

### এই Journey থেকে মূল শিক্ষা

1. **`chunk_size` ও `k` কোনো universal constant না** — document-এর ঘনত্ব ও গঠনের (টেবিল, বুলেট, লম্বা প্যারাগ্রাফ) উপর নির্ভর করে tune করতে হয়।
2. **LLM কখনো hallucinate করেনি।** দুই bug-এই সে শুধু সেই chunk থেকেই সৎভাবে উত্তর দিয়েছে যা তাকে দেওয়া হয়েছিল। এটা প্রমাণ করে Phase 5-এর grounding prompt design সঠিক ছিল — দোষ ছিল শুধু retrieval-এর configuration-এ।
3. **"সফল" message মানেই "সঠিক" না।** "Successfully indexed" দেখালেও ভুল collection-এ query চলতে পারে — তাই আসল document দিয়ে end-to-end টেস্ট জরুরি।
4. **ভুলের সূত্র ডেটার ভিতরেই থাকে** — অপ্রত্যাশিত উত্তরের ভিতরে অন্য document-এর হুবহু বাক্য দেখা একটা শক্তিশালী diagnostic সংকেত।

### Privacy নোট

Thesis proposal PDF-এ ৪ জন teammate ও ২ জন supervisor-এর আসল নাম আছে। তৃতীয় পক্ষের তথ্য হওয়ায় এটা public repo-তে commit করার আগে user-এর স্পষ্ট সম্মতি নেওয়া হয়েছে (নিজের resume-এর ক্ষেত্রে সম্মতি আলাদাভাবে দেওয়া হয়েছিল)। Filename-ও space/বন্ধনী মুছে পরিষ্কার করা হয়েছে (`bdsl-thesis-proposal.pdf`)।

---

## 🔍 Project Review (Phase 1–8 + Upload) — Gap ও Improvement তালিকা

> **নোট:** এই review `wiki.md` ও আমাদের আলোচনার উপর ভিত্তি করে। আসল কোড-ফাইল এই session-এ ছিল না, তাই যেখানে কোডে নিজে যাচাই করা দরকার সেখানে **(verify)** লেখা আছে।

### যা ভালো হয়েছে (ধরে রাখার মতো)
- Pipeline-এর প্রতিটা স্তর আলাদা module (`ingest` → `retrieval` → `generation` → `app`), তাই বদলানো সহজ।
- Secrets `.env`-এ, `.gitignore` শৃঙ্খলা, masked-debug pattern।
- Grounded prompt: দুই bug-এই LLM বানিয়ে বলেনি।
- User-facing error ও server log আলাদা (`HTTPException` + `print`), frontend `response.ok` check করে।
- Evaluation-এ সৎ, measured claim (vague "95%+" নয়)।

### P0 — Deploy / public করার আগে অবশ্যই

| # | Gap | কেন সমস্যা | Fix |
|---|---|---|---|
| 1 | `/upload`-এ validation নেই **(verify)** | যেকোনো ফাইল/অতিবড় ফাইল নেওয়া যায়; user-দেওয়া filename দিয়ে disk-এ সেভ করলে path-traversal ঝুঁকি; scanned/খালি PDF-এ 0 chunk → embed error | শুধু `.pdf` + content-type check, size limit (যেমন 10 MB), filename নিজে বানানো (uuid), chunk 0 হলে পরিষ্কার message, `try/except → HTTPException` (`/ask`-এর মতো) |
| 2 | Uploaded PDF git-এ ঢুকে যেতে পারে **(verify)** | `data/`-তে সেভ হলে এবং `data/` tracked হলে অন্যের/নিজের টেস্ট PDF commit হয়ে যাবে | আলাদা `uploads/` folder, `.gitignore`-এ যোগ; `data/` শুধু sample-এর জন্য |
| 3 | একটাই global collection | দুইজন user হলে একজনের upload অন্যজনের index মুছে দেয় | `/upload` একটা `doc_id` ফেরত দেবে, `/ask` সেটা পাঠাবে, collection নাম = `doc_id` (অন্তত limitation README-তে লেখা) |
| 4 | Config hard-coded | chunk_size, k, model নাম, CORS origin, `http://localhost:8000` (frontend) — deploy-এ সব বদলাতে হবে | `config.py` + env vars; একটাই `COLLECTION_NAME` constant; frontend-এ `import.meta.env.VITE_API_URL` |
| 5 | Rate-limit-এর আলাদা handling নেই | Voyage 3 RPM-এ বারবার "Could not reach the server"/503-র মতো অস্পষ্ট message | `RateLimitError` ধরে `429` + "২০ সেকেন্ড পরে চেষ্টা করো"; embed-এ retry+backoff; বড় PDF-এ batch করে embed |
| 6 | `.env.example` নেই, git history-তে secret আছে কিনা যাচাই হয়নি | অন্য কেউ clone করলে setup বুঝবে না; key কখনো commit হলে leak | `.env.example` (শুধু key-র নাম); `git log --all -p -S"AIza" -S"pa-" -S"sk-ant"` চালিয়ে দেখা; পাওয়া গেলে key rotate |
| 7 | Privacy নোটিশ নেই | Gemini free tier-এ data training-এ ব্যবহার হতে পারে; public demo-তে user জানে না | UI ও README-তে "সংবেদনশীল document আপলোড করো না" |
| 8 | `requirements.txt` পরিষ্কার না | `anthropic` আর ব্যবহার হয় না; `python-multipart` আছে কিনা **(verify)** | অব্যবহৃত package বাদ, `pip install -r requirements.txt` দিয়ে নতুন venv-এ টেস্ট |

### P1 — Quality ও Portfolio-মূল্য সবচেয়ে বেশি বাড়ায়

| # | Improvement | কেন |
|---|---|---|
| 9 | **Sources + page number** দেখানো (chunk-এর সাথে `page` metadata সংরক্ষণ, API response-এ `sources`, frontend-এ expandable "Sources") | Answer যাচাইযোগ্য হয় — RAG-এর সবচেয়ে বড় বিশ্বাসযোগ্যতার বৈশিষ্ট্য |
| 10 | **"Document-এ নেই" threshold** — সবচেয়ে কাছের chunk-এর cosine distance খুব বেশি হলে LLM-কে না ডেকেই বলা | অপ্রাসঙ্গিক প্রশ্নে বানানো উত্তর ও API খরচ দুটোই কমে |
| 11 | **Evaluation শক্ত করা:** এখনকার set শুধু resume-এর ৫টা প্রশ্ন; পরে যে দুটো bug ধরা পড়েছে (table split, ভুল collection) সেগুলো এই set ধরতে পারত না | প্রতি document-এ ১৫–২০ প্রশ্ন, তার মধ্যে **multi-chunk** প্রশ্ন (যেমন "৫ জন member কে কে?" — সব keyword hit লাগবে) ও **negative** প্রশ্ন (উত্তর নেই, "নেই" বলতে হবে); `chunk_size/k` experiment table; README-তে সংখ্যা আপডেট |
| 12 | **Automated tests + CI:** `pytest` দিয়ে cleaning/chunking, FastAPI `TestClient` (Voyage/Gemini mock করে), GitHub Actions | "Production-level" দাবির সবচেয়ে সরাসরি প্রমাণ |
| 13 | Model pin: `gemini-flash-latest` alias নিঃশব্দে বদলায় | Evaluation-এর ফল reproducible থাকে না → নির্দিষ্ট version config-এ |
| 14 | Backend ছোট উন্নতি: `/health` endpoint, `print` → `logging`, `async def`-এ blocking call থাকলে `def` করা **(verify)** | Deploy-এ monitoring, event-loop block এড়ানো |
| 15 | Frontend: কোন document এখন active তা দেখানো, chat history (শুধু শেষ উত্তর না), `aria-live` status, কোন error (network বনাম rate-limit) আলাদা message | UX ও accessibility |
| 16 | README: screenshot/GIF, architecture diagram, "Known limitations", Future Roadmap (Docs/Slides export, vector DB বিকল্প) | Recruiter প্রথমে README-ই দেখে |
| 17 | Exam-style prompt (Phase 6 note) এখনো অপরীক্ষিত | থিসিস/lecture PDF দিয়ে টেস্ট করে UI-তে "Concise / Exam-style" toggle |

### P2 — Stretch (পরে, ঐচ্ছিক)
- **Hybrid search** (BM25 + vector) বা reranker — "সব member-এর নাম দাও"-ধরনের list-প্রশ্নে pure semantic search দুর্বল।
- Follow-up প্রশ্নের জন্য conversation memory (query rewriting)।
- Streaming response (SSE)।
- Scanned PDF-এর জন্য OCR।

### অমীমাংসিত ছোট বিষয় (Open items)
- "Could not reach the server" error-এর আসল কারণ (CORS port বনাম Voyage rate-limit) চূড়ান্তভাবে নিশ্চিত হয়নি — P0 #5 ঠিক হলে frontend আলাদা message দেখাবে, তখন সহজে ধরা যাবে।
- Google AI Studio-র quota/usage কোন Project-এ দেখাচ্ছে তা মেলানো বাকি (API key-র শুরু/শেষ অংশ দিয়ে "API Keys" পেজে মেলানো যায়)।

### 🧭 শিক্ষা: যা আমি নিজে থেকে বলিনি (Review-র ফাঁক)

Project structure গোছানোর প্রস্তাব Sadat নিজে তুলেছেন; আমার প্রথম review-তে এটা ছিল না, যদিও root-এ আসল কোড, শেখার script, `test_`-নামের API-call script আর দুটো প্রায় একই নামের `store_vector*.py` মিশে ছিল। এখন থেকে প্রতিটা review ও প্রতিটা Phase-এর শুরুতে নিচের checklist **নিজে থেকে** দেখানো হবে, কেউ না চাইতেই:

- **Folder structure ও নাম:** কোড, experiment, data, docs আলাদা কিনা
- **Duplicate/dead ফাইল:** আর `test_*` নামের ফাইল যা আসলে test না (`pytest` ভুল করে চালিয়ে API quota খরচ করবে)
- **Secrets ও `.gitignore`:** নতুন folder-এও কাজ করছে কিনা (`git check-ignore -v`)
- **Docs stale কিনা:** README, wiki, run command (এই project-এ README সত্যিই Phase 2-এর অবস্থায় আটকে ছিল)
- **`requirements.txt`** নতুন খালি venv-এ পরিষ্কার install হয় কিনা
- **Commit-এ কী ঢুকছে:** `git status`, আর তৃতীয় পক্ষের তথ্য আছে কিনা

### ✅ Phase 8.5 — Step 0: Project Structure গোছানো (সম্পন্ন)

| আগে (root-এ সব মিশ্রিত) | এখন |
|---|---|
| `app.py`, `ingest.py`, `retrieval.py`, `generation.py`, `evaluate.py`, `requirements.txt` | `backend/` |
| `data/`, `chroma_db/`, `.env` | `backend/` (সব gitignored) |
| `check_env.py`, `embed_*.py`, `extract.py`, `query_test.py`, `store_vector*.py` | `backend/experiments/` |
| `test_generation.py`, `test_retrieval.py` | `backend/experiments/try_generation.py`, `try_retrieval.py` (নাম বদলানো, যাতে `pytest` এদের test ভাবে না) |
| root `venv/` | মুছে `backend/venv/` নতুন করে বানানো |

**শেখা:**
- `venv` move করা যায় না (ভিতরে পুরোনো absolute path থাকে), নতুন করে বানাতে হয়। এতে `requirements.txt`-এরও আসল পরীক্ষা হয়ে যায়: নতুন খালি environment-এ সব package বসেছে।
- নতুন folder-এও secret আটকাচ্ছে কিনা `git check-ignore -v` দিয়ে যাচাই করা (শুধু `.gitignore` পড়ে ধরে নেওয়া না)।
- `data/` ignore করা হয়েছে (তৃতীয় পক্ষের নাম থাকা PDF থাকায়)। কিন্তু `.gitignore` শুধু ভবিষ্যতের ফাইল আটকায়; আগে commit হওয়া PDF git history-তে থেকে যায়।
- Chroma database সরাসরি জিজ্ঞেস করে (API ছাড়াই) index অক্ষত আছে কিনা দেখা যায় (`collection.count()`, `collection.get(limit=1)`)।
- README নতুন করে লেখা হয়েছে; `.env.example` যোগ হয়েছে।
- README পুরোপুরি নতুন করে লেখা হয়েছে (আগেরটা Phase 2-এর অবস্থায় আটকে ছিল, কোড-fence ও escape করা ছিল); `backend/.env.example` যোগ হয়েছে (শুধু key-র নাম, আসল secret না)।

### ✅ Phase 8.5 — Step 1: Gemini `503` ও Retry with Backoff

**সমস্যা:** UI-তে বারবার "The AI service is temporarily unavailable" আসছিল, আর প্রথমে ধরা হয়েছিল quota শেষ।

**আসল কারণ (server log থেকে):** `503 UNAVAILABLE ... This model is currently experiencing high demand` — Google-এর server সাময়িকভাবে ব্যস্ত; quota শেষ হলে আসতো `429 RESOURCE_EXHAUSTED`। log থেকে আরও প্রমাণ হলো: Voyage embedding ও Chroma search সফল ছিল, ব্যর্থ হয়েছে শুধু Gemini-র ধাপ।

**শেখা:**
- **অনুমান না করে log পড়তে হয়।** একই user-facing message (`503`) তিন ভিন্ন কারণে আসতে পারে: quota (429), Voyage rate-limit, বা Google-এর ভিড় (503)। user-facing message আর server log আলাদা রাখার সিদ্ধান্ত (Phase 7) এখানে কাজে লেগেছে।
- **সাময়িক (`500/503/504`) বনাম স্থায়ী (`429`, `400`, `401`) error আলাদা:** সাময়িক error-এ retry করলে লাভ আছে, quota শেষ বা ভুল key-তে নেই।
- **Exponential backoff:** প্রতি চেষ্টার মাঝে অপেক্ষা দ্বিগুণ (২s, ৪s, ৮s), সর্বোচ্চ ৪ চেষ্টা। ব্যস্ত server-কে একনাগাড়ে ধাক্কা না দিয়ে দম নেওয়ার সময় দেওয়া হয়।
- `generate_answer()` এখন শুধু `{500, 503, 504}`-তে retry করে; বাকি error `raise` হয়ে `app.py`-র `HTTPException` handler-এ যায়।

**এখনো বাকি:** `429` (quota) ও `503` (ভিড়) UI-তে আলাদা message; Voyage `RateLimitError`-এর জন্য আলাদা `429`।

### ✅ UI: `<input>` → `<textarea>`

লম্বা প্রশ্ন এক লাইনে কেটে যাচ্ছিল। **শেখা:** `<input>` সবসময় এক লাইনের, লেখা ভাঙে না; একাধিক লাইনের জন্য `<textarea>` লাগে। Enter = প্রশ্ন পাঠানো, `Shift+Enter` = নতুন লাইন (`e.preventDefault()` দিয়ে textarea-র নিজস্ব newline আটকানো + `!e.shiftKey` check)। CSS-এ `font-family: inherit` লাগে, কারণ textarea-র default font monospace।

### Open items
- `store_vector.py` বনাম `store_vectors.py` (`diff` এখনো করা হয়নি)
- **থিসিস PDF, `pdf_content.pdf`, `resume.pdf` GitHub-এ আগেই push হয়ে গেছে** (`origin/main`-এর সাথে up to date ছিল)। `data/` ignore করায় নতুন commit থেকে এগুলো বাদ গেছে, কিন্তু git history-তে থেকে যাবে। `pdf_content.pdf`-এ অন্য একজনের নাম আছে — history থেকে মুছতে চাইলে আলাদা, ঝুঁকিপূর্ণ কাজ (history rewrite + force-push)।

### প্রস্তাবিত Phase 8.5 — Hardening (Step 0 সম্পন্ন, বাকিগুলো অনুমতির অপেক্ষায়)
ক্রম: ১) upload validation + `uploads/` + `.gitignore` → ২) `config.py` + env vars + `COLLECTION_NAME` → ৩) rate-limit handling (429 + retry) → ৪) sources + page number → ৫) "নেই" threshold → ৬) evaluation বাড়ানো → ৭) pytest + CI → ৮) README polish। তারপর Phase 9 (Deploy)।

---

## Phase 9: Deployment

**Status:** ঐচ্ছিক (stretch goal) — এখনো সিদ্ধান্ত হয়নি
