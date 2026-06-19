"""Lightweight embedding sidecar for Emart product vector search.

Loads all-mpnet-base-v2 once at startup (768-dim, matching Qdrant collection).
Exposes POST /embed {"text": "..."} → {"vector": [...], "dim": 768}.
Bind: 127.0.0.1:8077 only.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-mpnet-base-v2")

class EmbedRequest(BaseModel):
    text: str

@app.post("/embed")
def embed(req: EmbedRequest):
    vec = model.encode(req.text).tolist()
    return {"vector": vec, "dim": len(vec)}

@app.get("/health")
def health():
    return {"status": "ok", "model": "all-mpnet-base-v2", "dim": 768}
