import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# Import our Clean Modules
from app.models.schemas import QueryRequest, AIResponse, Citation
from app.services.librarian import librarian_service
from app.services.brain import brain_service

app = FastAPI(title="Nididhya API - Sacred Scriptures & AI Companion", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "modules": ["Brain", "Librarian"],
        "counts": {
            "vachanamrut": len(librarian_service.vachanamrut_data),
            "swamini_vato": len(librarian_service.swamini_vato_data),
            "topics": len(librarian_service.topics_data),
            "shikshapatri": len(librarian_service.shikshapatri_data)
        }
    }

# --- Vachanamrut Endpoints ---
@app.get("/vachanamrut")
@app.get("/api/vachanamrut")
def get_vachanamrut(
    chapter: str = Query(..., description="Chapter Name"),
    number: int = Query(..., description="Number"),
    section: str = Query("", description="Section (Optional)")
):
    result = librarian_service.get_full_text(chapter, section, number)
    if not result:
        raise HTTPException(status_code=404, detail="Vachanamrut not found")
    return result

@app.get("/api/vachanamrut/list")
def list_vachanamruts():
    return librarian_service.get_all_vachanamrut_summaries()

# --- Swamini Vato Endpoints ---
@app.get("/api/swaminivato/list")
def list_swamini_vato(prakran_no: int = Query(None, description="Optional Prakran Number (1-16)")):
    return librarian_service.get_all_swaminivato_summaries(prakran_no=prakran_no)

@app.get("/api/swaminivato")
def get_swamini_vat(
    prakran_no: int = Query(..., description="Prakran Number (1-16)"),
    vat_no: int = Query(..., description="Vat Number")
):
    result = librarian_service.get_swaminivato_vat(prakran_no=prakran_no, vat_no=vat_no)
    if not result:
        raise HTTPException(status_code=404, detail="Swamini Vat not found")
    return result

# --- Topics Endpoints ---
@app.get("/api/topics")
def list_topics():
    return librarian_service.get_all_topics()

# --- Shikshapatri Endpoints ---
@app.get("/api/shikshapatri")
def get_shikshapatri(shlok_no: int = Query(None, description="Optional Shlok Number (1-212)")):
    if shlok_no is not None:
        result = librarian_service.get_shikshapatri_shlok(shlok_no)
        if not result:
            raise HTTPException(status_code=404, detail="Shlok not found")
        return result
    return librarian_service.get_all_shikshapatri()

# --- UPDATED CHAT ENDPOINT ---
@app.post("/ask", response_model=AIResponse)
def ask_ai(request: QueryRequest):
    
    # A. Check for Manual Filters (Sidebar & Scope)
    conditions = []
    if request.scripture and request.scripture != "All":
        sc_clean = request.scripture.lower().replace(" ", "_")
        conditions.append({"scripture": sc_clean})
    if request.chapter != "All": conditions.append({"chapter": request.chapter})
    if request.section != "All": conditions.append({"section": request.section})
    if request.vachanamrut_no > 0: conditions.append({"vachanamrut_no": request.vachanamrut_no})
    
    manual_clause = None
    if len(conditions) == 1: manual_clause = conditions[0]
    elif len(conditions) > 1: manual_clause = {"$and": conditions}

    # B. Ask the Brain (NOW PASSING HISTORY)
    results = brain_service.search(
        query=request.question,
        history=request.history,  # <--- Critical Update
        manual_filters=manual_clause
    )
    
    # C. Handle Results
    if not results['documents'] or not results['documents'][0]:
         return AIResponse(answer="I could not find relevant information in the sacred scriptures for that request.", citations=[])

    docs = results['documents'][0]
    metas = results['metadatas'][0]
    context_text = "\n\n".join(docs)

    # D. Multi-Scripture System Prompt & Generation
    system_prompt = (
        "You are Nididhya, an authentic and revered spiritual assistant rooted in the teachings "
        "of Bhagwan Swaminarayan (Vachanamrut), Aksharbrahma Gunatitanand Swami (Swamini Vato), and the Shikshapatri.\n"
        "Instructions:\n"
        "1. Grounding: Answer the user's question clearly, spiritually, and compassionately using the provided sacred contexts.\n"
        "2. Language: Respond in clear, eloquent, and grammatically authentic English. Preserve sacred spiritual terms (e.g., Vairagya, Atma, Bhakti, Indriyas) with context.\n"
        "3. Anti-Repetition: Be concise, structured, and direct. Do not repeat phrases or sentences.\n"
        "4. Citations: Always cite your sources specifically (e.g., Vachanamrut Gadhada I 38, Swamini Vato 1.4, Shikshapatri Shlok 116)."
    )
    user_prompt = f"Context:\n{context_text}\n\nQuestion: {request.question}"
    
    answer = brain_service.generate_answer(system_prompt, user_prompt, history=request.history)

    citations = [Citation(text=d, metadata=m) for d, m in zip(docs, metas)]
    
    return AIResponse(answer=answer, citations=citations)

# --- SERVER-SENT EVENTS (SSE) STREAMING CHAT ENDPOINT ---
@app.post("/ask/stream")
def ask_ai_stream(request: QueryRequest):
    # A. Check for Manual Filters (Sidebar & Scope)
    conditions = []
    if request.scripture and request.scripture != "All":
        sc_clean = request.scripture.lower().replace(" ", "_")
        conditions.append({"scripture": sc_clean})
    if request.chapter != "All": conditions.append({"chapter": request.chapter})
    if request.section != "All": conditions.append({"section": request.section})
    if request.vachanamrut_no > 0: conditions.append({"vachanamrut_no": request.vachanamrut_no})
    
    manual_clause = None
    if len(conditions) == 1: manual_clause = conditions[0]
    elif len(conditions) > 1: manual_clause = {"$and": conditions}

    # B. Semantic Retrieval across all scriptures
    results = brain_service.search(
        query=request.question,
        history=request.history,
        manual_filters=manual_clause
    )
    
    docs = results['documents'][0] if results.get('documents') and results['documents'][0] else []
    metas = results['metadatas'][0] if results.get('metadatas') and results['metadatas'][0] else []
    context_text = "\n\n".join(docs)

    system_prompt = (
        "You are Nididhya, an authentic and revered spiritual assistant rooted in the teachings "
        "of Bhagwan Swaminarayan (Vachanamrut), Aksharbrahma Gunatitanand Swami (Swamini Vato), and the Shikshapatri.\n"
        "Instructions:\n"
        "1. Grounding: Answer the user's question clearly, spiritually, and compassionately using the provided sacred contexts.\n"
        "2. Language: Respond in clear, eloquent, and grammatically authentic English. Preserve sacred spiritual terms (e.g., Vairagya, Atma, Bhakti, Indriyas) with context.\n"
        "3. Anti-Repetition: Be concise, structured, and direct. Do not repeat phrases or sentences.\n"
        "4. Citations: Always cite your sources specifically (e.g., Vachanamrut Gadhada I 38, Swamini Vato 1.4, Shikshapatri Shlok 116)."
    )
    user_prompt = f"Context:\n{context_text}\n\nQuestion: {request.question}"

    def event_stream():
        citations_data = [Citation(text=d, metadata=m).model_dump() for d, m in zip(docs, metas)]
        # 1. Immediately yield citations so UI renders source pills
        yield f"event: citations\ndata: {json.dumps(citations_data)}\n\n"
        
        # 2. Stream tokens from LLM
        for token in brain_service.stream_answer(system_prompt, user_prompt, history=request.history):
            yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
            
        # 3. Stream completion signal
        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)