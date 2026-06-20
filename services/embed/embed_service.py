"""Embedding + reranking sidecar for Emart product vector search.

Models loaded at startup:
  - all-mpnet-base-v2 (768-dim bi-encoder, matching Qdrant collection)
  - BAAI/bge-reranker-v2-m3 (cross-encoder, ~150MB, for result reranking)

Endpoints:
  POST /embed   {"text": "..."} → {"vector": [...], "dim": 768}
  POST /rerank  {"query": "...", "documents": [...], "top_k": 5} → {"results": [...]}
  GET  /health  → status + loaded models

Bind: 127.0.0.1:8077 only.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, CrossEncoder

app = FastAPI()
embed_model = SentenceTransformer("all-mpnet-base-v2")
rerank_model: CrossEncoder | None = None

def _get_reranker() -> CrossEncoder:
    global rerank_model
    if rerank_model is None:
        rerank_model = CrossEncoder("BAAI/bge-reranker-v2-m3", max_length=512)
    return rerank_model

class EmbedRequest(BaseModel):
    text: str

class RerankRequest(BaseModel):
    query: str
    documents: list[str]
    top_k: int = 5

@app.post("/embed")
def embed(req: EmbedRequest):
    vec = embed_model.encode(req.text).tolist()
    return {"vector": vec, "dim": len(vec)}

@app.post("/rerank")
def rerank(req: RerankRequest):
    if not req.documents:
        return {"results": []}
    reranker = _get_reranker()
    pairs = [[req.query, doc] for doc in req.documents]
    scores = reranker.predict(pairs).tolist()
    ranked = sorted(
        [{"index": i, "score": round(s, 4), "document": req.documents[i]}
         for i, s in enumerate(scores)],
        key=lambda x: -x["score"],
    )
    return {"results": ranked[:req.top_k]}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "embed": "all-mpnet-base-v2",
            "rerank": "BAAI/bge-reranker-v2-m3" if rerank_model else "lazy-load",
        },
        "dim": 768,
    }
