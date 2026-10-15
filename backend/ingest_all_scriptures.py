"""
Nididhya - Multi-Scripture Vector Ingestion Pipeline
===================================================
Embeds all 5,359 chunks from Vachanamrut, Swamini Vato, and Shikshapatri
into ChromaDB using local Ollama (all-minilm, 384 dimensions) with batched upserts.
"""

import sys
import json
import time
from pathlib import Path
import chromadb
import ollama
from app.services.chunker import chunker_service

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = BASE_DIR / "Data"
DB_PATH = str(DATA_DIR / "vachanamrut_db")
COLLECTION_NAME = "nididhya_rag"
EMBED_MODEL = "nomic-embed-text"
BATCH_SIZE = 50


def sanitize_metadata(meta: dict) -> dict:
    """ChromaDB metadata only accepts str, int, float, bool. Converts None to empty strings."""
    clean = {}
    for k, v in meta.items():
        if v is None:
            clean[k] = ""
        elif isinstance(v, (str, int, float, bool)):
            clean[k] = v
        elif isinstance(v, list):
            clean[k] = ", ".join(str(x) for x in v)
        else:
            clean[k] = str(v)
    return clean


def run_ingestion():
    print("=" * 65)
    print("🌟 NIDIDHYA MULTI-SCRIPTURE VECTOR INGESTION PIPELINE")
    print("=" * 65)

    # 1. Connect to ChromaDB
    print(f"📦 Connecting to ChromaDB at: {DB_PATH}")
    client = chromadb.PersistentClient(path=DB_PATH)
    col = client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"✅ Collection '{COLLECTION_NAME}' ready (Current count: {col.count()})")

    # 2. Gather All Chunks
    all_chunks = []

    # A. Vachanamrut
    vac_path = DATA_DIR / "vachanamrut_master.json"
    if vac_path.exists():
        with open(vac_path, "r", encoding="utf-8") as f:
            vac_data = json.load(f)
        for d in vac_data:
            all_chunks.extend(chunker_service.chunk_vachanamrut_discourse(d))
        print(f"📄 Vachanamrut: {len(vac_data)} discourses -> {sum(1 for c in all_chunks if c['scripture'] == 'vachanamrut')} chunks")

    # B. Swamini Vato
    sv_path = DATA_DIR / "swamini_vato_master.json"
    if sv_path.exists():
        with open(sv_path, "r", encoding="utf-8") as f:
            sv_data = json.load(f)
        for v in sv_data:
            all_chunks.append(chunker_service.chunk_swamini_vato(v))
        print(f"📄 Swamini Vato: {len(sv_data)} vato -> {sum(1 for c in all_chunks if c['scripture'] == 'swamini_vato')} chunks")

    # C. Shikshapatri
    sp_path = DATA_DIR / "shikshapatri_master.json"
    if sp_path.exists():
        with open(sp_path, "r", encoding="utf-8") as f:
            sp_data = json.load(f)
        for s in sp_data:
            all_chunks.append(chunker_service.chunk_shikshapatri(s))
        print(f"📄 Shikshapatri: {len(sp_data)} shlokas -> {sum(1 for c in all_chunks if c['scripture'] == 'shikshapatri')} chunks")

    total_chunks = len(all_chunks)
    print(f"\n🚀 Total Chunks to Ingest: {total_chunks}")
    print(f"⚡ Batch Size: {BATCH_SIZE} | Embedding Model: {EMBED_MODEL}")
    print("-" * 65)

    # 3. Batch Embed & Upsert
    t_start = time.time()
    num_batches = (total_chunks + BATCH_SIZE - 1) // BATCH_SIZE

    for b_idx in range(num_batches):
        b_start_time = time.time()
        start_i = b_idx * BATCH_SIZE
        end_i = min(start_i + BATCH_SIZE, total_chunks)
        batch = all_chunks[start_i:end_i]

        ids = [c["chunk_id"] for c in batch]
        documents = [c["vector_text"] for c in batch]
        
        # Extract metadata (excluding large payload text to keep metadata index lean)
        metadatas = []
        for c in batch:
            m = {
                "scripture": c.get("scripture", ""),
                "chunk_type": c.get("chunk_type", ""),
                "chapter": c.get("chapter", ""),
                "section": c.get("section", ""),
                "vachanamrut_no": c.get("vachanamrut_no", 0),
                "prakran_no": c.get("prakran_no", 0),
                "prakran_name": c.get("prakran_name", ""),
                "vat_no": c.get("vat_no", 0),
                "shlok_no": c.get("shlok_no", 0),
                "title_en": c.get("title_en", ""),
                "title_gu": c.get("title_gu", ""),
                "questioner": c.get("questioner", ""),
                "speaker": c.get("speaker", ""),
                "tithi": c.get("tithi", ""),
                "panchang_date": c.get("panchang_date", "")
            }
            metadatas.append(sanitize_metadata(m))

        # Generate embeddings in single native batch via Ollama
        prefix_docs = [f"search_document: {doc_text}" for doc_text in documents]
        embed_resp = ollama.embed(model=EMBED_MODEL, input=prefix_docs)
        embeddings = embed_resp["embeddings"]

        # Upsert into ChromaDB
        col.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )

        b_elapsed = time.time() - b_start_time
        progress_pct = (end_i / total_chunks) * 100
        throughput = len(batch) / b_elapsed
        print(f"[{progress_pct:5.1f}%] Batch {b_idx + 1:2d}/{num_batches} ingested ({end_i:4d}/{total_chunks}) - {throughput:.1f} chunks/sec", flush=True)

    total_time = time.time() - t_start
    print("-" * 65)
    print(f"🎉 Ingestion Complete!")
    print(f"📊 Final Collection Count: {col.count()} vectors")
    print(f"⏱️ Total Time: {total_time:.1f}s (Average: {total_chunks / total_time:.1f} vectors/sec)")
    print("=" * 65)


if __name__ == "__main__":
    run_ingestion()
