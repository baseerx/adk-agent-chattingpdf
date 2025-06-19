import os
import fitz  # PyMuPDF for PDF processing
from fastapi import FastAPI, Request
from typing import Dict

from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  # To load environment variables

# --- Load environment variables from .env ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# --- Initialize FastAPI app ---
app = FastAPI()

# Add this CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global instances ---
vectorstore = None               # FAISS index
llm = None                       # Generative AI model
embeddings_model = None         # Embedding model

# --- Utility Functions ---


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts all text from the given PDF file using PyMuPDF (fitz).
    """
    try:
        with fitz.open(pdf_path) as doc:
            return "".join(page.get_text() for page in doc)
    except Exception as e:
        raise RuntimeError(f"Error reading PDF: {e}")


def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """
    Splits long text into smaller overlapping chunks for embedding.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_text(text)


def embed_text_chunks(chunks: list[str]) -> FAISS:
    """
    Embeds the given text chunks using Google Generative AI embeddings
    and stores them in a FAISS vector database.
    """
    global embeddings_model
    if not embeddings_model:
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001")

    return FAISS.from_texts(texts=chunks, embedding=embeddings_model)

# --- FastAPI Endpoints ---


@app.post("/webhook")
async def webhook(request: Request) -> Dict[str, str]:
    """
    Receives a query via POST request and uses RAG to answer using loaded PDF content.
    """
    global vectorstore, llm

    if not vectorstore:
        return {"response": "PDF data not loaded. Try again later."}

    if not llm:
        try:
            llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        except Exception as e:
            return {"response": f"LLM initialization failed: {e}"}

    try:
        req_json = await request.json()
        query = req_json.get("query")

        if not query:
            return {"response": "Missing 'query' in request body."}

        # Find similar chunks using FAISS
        relevant_docs = vectorstore.similarity_search(query)
        context = "\n\n".join(doc.page_content for doc in relevant_docs)

        # Construct prompt for the LLM
        messages = [
            SystemMessage(
                content="You are a helpful assistant that answers based on PDF content."),
            HumanMessage(
                content=f"--PDF Context--\n{context}\n\n--Question--\n{query}\n\n--Answer--")
        ]

        # Get response from LLM
        response = llm.invoke(messages)
        return {"response": response.content}

    except Exception as e:
        return {"response": f"Error processing request: {e}"}

# --- Application Startup ---


@app.on_event("startup")
async def startup_event():
    """
    At startup, extract PDF text, chunk it, embed it into FAISS,
    and initialize LLM and embedding models.
    """
    global vectorstore, llm, embeddings_model

    pdf_path = "BK-Thesis.pdf"

    try:
        print(f"Reading PDF: {pdf_path}")
        full_text = extract_text_from_pdf(pdf_path)

        print("Splitting text...")
        chunks = split_text(full_text)

        print(f"Embedding {len(chunks)} chunks...")
        vectorstore = embed_text_chunks(chunks)

        # Initialize LLM and embeddings once
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001")

        print("Application initialized successfully.")

    except Exception as e:
        print(f"[Startup Error] {e}")
        print("Make sure GOOGLE_API_KEY is set correctly in your .env file.")
