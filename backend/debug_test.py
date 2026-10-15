import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

from app.services.brain import brain_service

query = "મનને વશ કરવાનો ઉપાય શું છે?"
print(f"Query: {query}")

results = brain_service.search(query=query)
docs = results['documents'][0]
metas = results['metadatas'][0]

print(f"Retrieved {len(docs)} documents:")
for i, (d, m) in enumerate(zip(docs, metas)):
    print(f"--- Doc {i} ---")
    print("Metadata:", m)
    print("Snippet:", d[:250].replace('\n', ' '))

context_text = "\n\n".join(docs)
system_prompt = (
    "You are Nididhya, an authentic and revered spiritual assistant rooted in the teachings "
    "of Bhagwan Swaminarayan (Vachanamrut), Aksharbrahma Gunatitanand Swami (Swamini Vato), and the Shikshapatri. "
    "Answer the user's question clearly, spiritually, and compassionately using the provided sacred contexts. "
    "Always cite your sources specifically (e.g., Vachanamrut Gadhada I 38, Swamini Vato 1.4, Shikshapatri Shlok 116)."
)
user_prompt = f"Context:\n{context_text}\n\nQuestion: {query}"

print("\n--- Testing Streaming with repeat_penalty=1.2, repeat_last_n=128, temperature=0.3 ---")
import ollama

test_sys_prompt = (
    "You are Nididhya, a spiritual assistant rooted in the Swaminarayan Sampradaya "
    "(Vachanamrut, Swamini Vato, Shikshapatri).\n"
    "Instructions:\n"
    "1. Answer the question accurately using ONLY the provided context.\n"
    "2. Respond concisely in natural, grammatically correct Gujarati.\n"
    "3. Never repeat sentences or loops. Cite the specific scripture.\n"
)

stream = ollama.chat(
    model="qwen2.5:3b",
    messages=[
        {"role": "system", "content": test_sys_prompt},
        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {query}"}
    ],
    stream=True,
    options={
        "temperature": 0.3,
        "repeat_penalty": 1.2,
        "repeat_last_n": 128,
        "top_p": 0.9,
    }
)

tokens = []
for chunk in stream:
    t = chunk.get("message", {}).get("content", "")
    print(t, end="", flush=True)
    tokens.append(t)
    if len(tokens) > 500:
        print("\n[Stopped: reached token limit]")
        break
print("\n--- Done ---")

