import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.services.brain import brain_service

query = "How can one conquer and control the mind?"
print(f"=== Testing English Spiritual Query ===\nQuery: '{query}'\n")

# 1. Search ChromaDB
results = brain_service.search(query=query)
docs = results['documents'][0]
metas = results['metadatas'][0]

print(f"Retrieved {len(docs)} sacred contexts:")
for i, (d, m) in enumerate(zip(docs, metas)):
    scr = m.get('scripture', '')
    ref = ""
    if scr == 'vachanamrut':
        ref = f"Vachanamrut {m.get('chapter', '')} {m.get('section', '')} {m.get('vachanamrut_no', '')} ({m.get('title_en', '')})"
    elif scr == 'swamini_vato':
        ref = f"Swamini Vato {m.get('prakran_no', '')}.{m.get('vat_no', '')} ({m.get('title_en', '')})"
    elif scr == 'shikshapatri':
        ref = f"Shikshapatri Shlok {m.get('shlok_no', '')}"
    print(f"  [{i+1}] {ref}")

context_text = "\n\n".join(docs)
system_prompt = (
    "You are Nididhya, an authentic and revered spiritual assistant rooted in the teachings "
    "of Bhagwan Swaminarayan (Vachanamrut), Aksharbrahma Gunatitanand Swami (Swamini Vato), and the Shikshapatri.\n"
    "Instructions:\n"
    "1. Grounding: Answer the user's question clearly, spiritually, and compassionately using ONLY the provided sacred contexts.\n"
    "2. Language: Respond in clear, eloquent, and grammatically authentic English. Preserve sacred terms (e.g., Vairagya, Atma, Bhakti, Indriyas) with brief explanations.\n"
    "3. Anti-Repetition: Be concise, structured, and direct. Do not repeat phrases or sentences.\n"
    "4. Citations: Always explicitly cite your sources (e.g., Vachanamrut Sarangpur 1, Swamini Vato 1.4, Shikshapatri Shlok 116)."
)
user_prompt = f"Context:\n{context_text}\n\nQuestion: {query}"

print("\n=== Streaming English Response ===")
full_answer = ""
for token in brain_service.stream_answer(system_prompt, user_prompt):
    full_answer += token
    print(token, end="", flush=True)

print("\n\n=== Completed Successfully ===")
print(f"Total tokens/chars: {len(full_answer)} characters")
