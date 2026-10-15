import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

try:
    import chromadb
except ImportError:
    chromadb = None

try:
    import ollama
except ImportError:
    ollama = None

try:
    from groq import Groq
except ImportError:
    Groq = None


class Brain:
    def __init__(self, db_path: str):
        # 1. Ollama Local Setup
        self.ollama_available = False
        self.ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:3b")
        self.ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.ollama_client = None
        
        if ollama:
            try:
                self.ollama_client = ollama.Client(host=self.ollama_host)
                # Test connectivity
                models_info = self.ollama_client.list()
                model_names = [m.model for m in getattr(models_info, "models", [])]
                self.ollama_available = True
                print(f"[Brain] Local Ollama detected at {self.ollama_host}! Active models: {model_names}")
            except Exception as e:
                print(f"[Brain Notice] Ollama daemon not reachable at {self.ollama_host}: {e}")
                self.ollama_available = False

        # 2. Cloud Groq Setup (Optional / Fallback)
        self.groq_key = os.getenv("GROQ_API_KEY")
        if self.groq_key and Groq:
            self.groq_client = Groq(api_key=self.groq_key)
            print("[Brain] Groq cloud client initialized.")
        else:
            self.groq_client = None

        # 3. ChromaDB Multi-Scripture Vector Database Connection
        self.collection = None
        if chromadb and os.path.exists(db_path):
            try:
                self.chroma_client = chromadb.PersistentClient(path=db_path)
                # Connect to the multi-scripture nididhya_rag collection
                self.collection = self.chroma_client.get_collection(name="nididhya_rag")
                count = self.collection.count()
                print(f"[Brain] Connected to ChromaDB 'nididhya_rag' with {count} multi-scripture chunks.")
            except Exception as e:
                print(f"[Brain Notice] Could not load ChromaDB 'nididhya_rag': {e}")
                try:
                    self.collection = self.chroma_client.get_collection(name="vachanamrut_rag")
                    print(f"[Brain Fallback] Connected to 'vachanamrut_rag' ({self.collection.count()} chunks).")
                except Exception:
                    self.collection = None
        else:
            print("[Brain Notice] Running in scripture browsing mode.")

    def get_embedding(self, text: str) -> list[float]:
        """Generate embedding vector using local Ollama nomic-embed-text with asymmetric search prefix."""
        if self.ollama_available and self.ollama_client:
            try:
                query_prompt = f"search_query: {text}"
                res = self.ollama_client.embed(model=self.ollama_embed_model, input=[query_prompt])
                if res.get("embeddings"):
                    return res["embeddings"][0]
            except Exception as e:
                print(f"[Brain] Ollama embedding error: {e}")
        return []

    def extract_metadata_from_query(self, user_query: str, chat_history: list = None):
        """Uses Regex fast-path + LLM with History to detect specific scripture references."""
        import re

        # 1. Swamini Vato Regex (e.g. "Swamini Vato 1.16", "Vat 1.4", "Prakaran 2 Vat 5")
        sv_pattern = r'\b(?:Swamini\s+Vato?|Vat|Prakaran|Prakran)\s*(\d+)(?:[.\s]+(?:Vat\s*)?(\d+))?\b'
        sv_match = re.search(sv_pattern, user_query, re.IGNORECASE)
        if sv_match:
            prak = int(sv_match.group(1))
            vat = int(sv_match.group(2)) if sv_match.group(2) else None
            res = {"scripture": "swamini_vato", "prakran_no": prak}
            if vat:
                res["vat_no"] = vat
            print(f"🧠 Brain Router (Fast Regex - Swamini Vato): Detected {res}")
            return res

        # 2. Shikshapatri Regex (e.g. "Shikshapatri Shlok 116", "Shlok 50")
        sp_pattern = r'\b(?:Shikshapatri\s+)?Shlok(?:a)?\s*(\d+)\b'
        sp_match = re.search(sp_pattern, user_query, re.IGNORECASE)
        if sp_match:
            s_num = int(sp_match.group(1))
            res = {"scripture": "shikshapatri", "shlok_no": s_num}
            print(f"🧠 Brain Router (Fast Regex - Shikshapatri): Detected {res}")
            return res

        # 3. Vachanamrut Regex (e.g. "Gadhada I 38", "Gadhada 1 38", "Vartal 1", "Sarangpur 7")
        pattern = r'\b(Gadhada|Sarangpur|Kariyani|Loya|Panchala|Vartal|Amdavad|Jetalpur|Ashlali)\s*(?:(I{1,3}|Pratham|Madhya|Antya|Middle|Last|\b1\b|\b2\b|\b3\b)\s+)?(?:No\.?\s*)?(\d+)\b'
        match = re.search(pattern, user_query, re.IGNORECASE)
        if match:
            chap = match.group(1).capitalize()
            sec_raw = (match.group(2) or "").strip().upper()
            sec_map = {
                "1": "I", "I": "I", "PRATHAM": "Pratham",
                "2": "II", "II": "II", "MADHYA": "Madhya",
                "3": "III", "III": "III", "ANTYA": "Antya"
            }
            sec = sec_map.get(sec_raw, sec_raw)
            num = int(match.group(3))
            print(f"🧠 Brain Router (Fast Regex - Vachanamrut): Detected {chap} {sec} {num}")
            res = {"scripture": "vachanamrut", "chapter": chap, "vachanamrut_no": num}
            if sec:
                res["section"] = sec
            return res

        # 4. Fallback to LLM Router with History context
        history_context = ""
        recent_msgs = chat_history[-4:] if chat_history else []
        for msg in recent_msgs:
            role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
            history_context += f"{role}: {content}\n"

        system_prompt = f"""
You are a Query Router for Swaminarayan scriptures (Vachanamrut, Swamini Vato, Shikshapatri).
Analyze the User's latest input and conversation history.

CONTEXT FROM HISTORY:
{history_context}

INSTRUCTIONS:
1. If the user mentions or refers to a specific scripture reference (even via 'this', 'it', 'that discourse'), extract it.
2. Output JSON ONLY with applicable keys: scripture ('vachanamrut' | 'swamini_vato' | 'shikshapatri'), chapter, section, vachanamrut_no, prakran_no, vat_no, shlok_no.
If no specific reference is mentioned or active, return: {{}}
"""

        # Try Local Ollama first if available
        if self.ollama_available and self.ollama_client:
            try:
                res = self.ollama_client.chat(
                    model=self.ollama_chat_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ],
                    format="json",
                    options={"temperature": 0}
                )
                raw = res["message"]["content"]
                result = json.loads(raw)
                if any(k in result for k in ["vachanamrut_no", "vat_no", "shlok_no"]):
                    print(f"🧠 Brain Router (Local Ollama): Detected {result}")
                    return result
            except Exception as e:
                print(f"Router local error: {e}")

        # Fallback to Groq if configured
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ],
                    temperature=0,
                    response_format={"type": "json_object"}
                )
                result = json.loads(completion.choices[0].message.content)
                if any(k in result for k in ["vachanamrut_no", "vat_no", "shlok_no"]):
                    print(f"🧠 Brain Router (Groq): Detected {result}")
                    return result
            except Exception as e:
                print(f"Router Groq error: {e}")

        return None

    def search(self, query: str, history: list = None, manual_filters: dict = None):
        """Perform semantic search across Vachanamrut, Swamini Vato, and Shikshapatri."""
        if not self.collection:
            return {'documents': [], 'metadatas': []}

        final_filters = manual_filters if manual_filters else {}

        if not final_filters:
            auto_filters = self.extract_metadata_from_query(query, history or [])
            if auto_filters:
                conditions = []
                if auto_filters.get("scripture"):
                    conditions.append({"scripture": auto_filters["scripture"]})
                if auto_filters.get("chapter"):
                    conditions.append({"chapter": auto_filters["chapter"]})
                if "section" in auto_filters and auto_filters["section"]:
                    conditions.append({"section": auto_filters["section"]})
                if auto_filters.get("vachanamrut_no"):
                    conditions.append({"vachanamrut_no": int(auto_filters["vachanamrut_no"])})
                if auto_filters.get("prakran_no"):
                    conditions.append({"prakran_no": int(auto_filters["prakran_no"])})
                if auto_filters.get("vat_no"):
                    conditions.append({"vat_no": int(auto_filters["vat_no"])})
                if auto_filters.get("shlok_no"):
                    conditions.append({"shlok_no": int(auto_filters["shlok_no"])})

                if len(conditions) == 1:
                    final_filters = conditions[0]
                elif len(conditions) > 1:
                    final_filters = {"$and": conditions}

        # Embed query with local Ollama
        query_vector = self.get_embedding(query)

        if query_vector:
            return self.collection.query(
                query_embeddings=[query_vector],
                n_results=5,
                where=final_filters if final_filters else None
            )
        else:
            # Fallback to text query if collection has a default embedding function
            try:
                return self.collection.query(
                    query_texts=[query],
                    n_results=5,
                    where=final_filters if final_filters else None
                )
            except Exception as e:
                print(f"[Brain Search Error] {e}")
                return {'documents': [[]], 'metadatas': [[]]}

    def generate_answer(self, system_prompt: str, user_prompt: str) -> str:
        """Generate spiritual response using local Qwen 2.5 or Groq."""
        # 1. Try Local Ollama (qwen2.5:3b)
        if self.ollama_available and self.ollama_client:
            try:
                res = self.ollama_client.chat(
                    model=self.ollama_chat_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    options={
                        "temperature": 0.3,
                        "repeat_penalty": 1.25,
                        "repeat_last_n": 128,
                        "top_k": 40,
                        "top_p": 0.9,
                    }
                )
                return res["message"]["content"]
            except Exception as e:
                print(f"[Brain] Local Ollama generation error: {e}")

        # 2. Try Groq Cloud if available
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.3,
                    frequency_penalty=0.5,
                    presence_penalty=0.3,
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"[Brain] Groq generation error: {e}")

    def stream_answer(self, system_prompt: str, user_prompt: str):
        """Streams answer token-by-token using local Ollama (qwen2.5:3b) or Groq."""
        if self.ollama_available and self.ollama_client:
            try:
                stream = self.ollama_client.chat(
                    model=self.ollama_chat_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    stream=True,
                    options={
                        "temperature": 0.3,
                        "repeat_penalty": 1.25,
                        "repeat_last_n": 128,
                        "top_k": 40,
                        "top_p": 0.9,
                    }
                )
                for chunk in stream:
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
                return
            except Exception as e:
                print(f"[Brain Stream Error] {e}")

        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.3,
                    frequency_penalty=0.5,
                    presence_penalty=0.3,
                    stream=True
                )
                for chunk in completion:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield delta
                return
            except Exception as e:
                print(f"[Brain Groq Stream Error] {e}")

        yield "Please ensure Ollama is running with `qwen2.5:3b` or add `GROQ_API_KEY` to `.env`."


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = str(BASE_DIR / "Data" / "vachanamrut_db")
brain_service = Brain(db_path=DB_PATH)