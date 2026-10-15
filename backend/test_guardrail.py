import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

from app.services.brain import brain_service

query = "મનને વશ કરવાનો ઉપાય શું છે?"
print(f"=== Testing Query: {query} ===")

results = brain_service.search(query=query)
docs = results['documents'][0]
metas = results['metadatas'][0]

print(f"Retrieved {len(docs)} docs:")
for i, (d, m) in enumerate(zip(docs, metas)):
    print(f"\n--- [{i+1}] {m.get('scripture')} (Prak {m.get('prakran_no')}, Vat {m.get('vat_no')}) ---")
    print(d[:300])

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
user_prompt = f"Context:\n{context_text}\n\nQuestion: {query}"

print("\n=== Streaming Answer ===")
full_answer = ""
for token in brain_service.stream_answer(system_prompt, user_prompt):
    full_answer += token
    print(token, end="", flush=True)

print("\n\n=== Verification Finished ===")
print(f"Total characters generated: {len(full_answer)}")
