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

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from fastembed import TextEmbedding
except ImportError:
    TextEmbedding = None


class Brain:
    def __init__(self, db_path: str):
        # 1. Self-Contained FastEmbed ONNX (768-dim Embeddings - Zero Ollama required)
        self.embed_model = None
        if TextEmbedding:
            try:
                self.embed_model = TextEmbedding("nomic-ai/nomic-embed-text-v1.5")
                print("[Brain] FastEmbed self-contained embedding engine loaded (nomic-ai/nomic-embed-text-v1.5).")
            except Exception as e:
                print(f"[Brain Notice] FastEmbed init error: {e}")

        # 2. Ollama Local Setup (Optional Offline Fallback Only)
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

        # 2. Cloud LLMs: FreeLLMAPI (Tier 1 Primary), Groq, and Google Gemini
        self.freellm_url = os.getenv("FREELLMAPI_URL", "http://localhost:3001/v1")
        self.freellm_key = os.getenv("FREELLMAPI_KEY")
        self.freellm_client = None

        if self.freellm_key and OpenAI:
            try:
                self.freellm_client = OpenAI(base_url=self.freellm_url, api_key=self.freellm_key)
                print(f"[Brain] FreeLLMAPI proxy connected at {self.freellm_url} (Tier 1 Gateway).")
            except Exception as e:
                print(f"[Brain Notice] FreeLLMAPI init error: {e}")
                self.freellm_client = None

        self.groq_key = os.getenv("GROQ_API_KEY")
        if self.groq_key and Groq:
            try:
                self.groq_client = Groq(api_key=self.groq_key)
                print("[Brain] Groq cloud client initialized.")
            except Exception as e:
                print(f"[Brain Notice] Groq init error: {e}")
                self.groq_client = None
        else:
            self.groq_client = None

        self.gemini_key = os.getenv("GEMINI_API_KEY")
        if self.gemini_key and genai:
            try:
                genai.configure(api_key=self.gemini_key)
                self.gemini_client = genai.GenerativeModel("gemini-3.5-flash-lite")
                print("[Brain] Google Gemini client initialized (Direct Fallback).")
            except Exception as e:
                print(f"[Brain Notice] Gemini init error: {e}")
                self.gemini_client = None
        else:
            self.gemini_client = None

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
        """Generate 768-dim embedding vector using FastEmbed ONNX (zero Ollama required)."""
        # 1. Primary: FastEmbed in-process (20ms, 100% self-contained)
        if self.embed_model:
            try:
                query_prompt = f"search_query: {text}"
                vecs = list(self.embed_model.embed([query_prompt]))
                if vecs:
                    return vecs[0].tolist()
            except Exception as e:
                print(f"[Brain] FastEmbed error: {e}")

        # 2. Fallback: Local Ollama (if available)
        if self.ollama_available and self.ollama_client:
            try:
                query_prompt = f"search_query: {text}"
                res = self.ollama_client.embed(model=self.ollama_embed_model, input=[query_prompt])
                if res.get("embeddings"):
                    return res["embeddings"][0]
            except Exception as e:
                print(f"[Brain] Ollama embedding fallback error: {e}")
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

        # Try Fast Groq first if available (50ms latency)
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

        # Try FreeLLMAPI
        if self.freellm_client:
            try:
                completion = self.freellm_client.chat.completions.create(
                    model="auto",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ],
                    temperature=0,
                    response_format={"type": "json_object"}
                )
                result = json.loads(completion.choices[0].message.content)
                if any(k in result for k in ["vachanamrut_no", "vat_no", "shlok_no"]):
                    print(f"🧠 Brain Router (FreeLLMAPI): Detected {result}")
                    return result
            except Exception as e:
                print(f"Router FreeLLMAPI error: {e}")

        # Fallback to Local Ollama if available
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

        # Contextualize query if user is asking a follow-up referring to previous context
        search_text = query
        if history:
            import re
            referential_markers = ["it", "this", "that", "these", "those", "he", "she", "they", "point", "above", "second", "first", "third", "elaborate", "explain", "more", "why", "how", "what about", "meaning"]
            q_lower = query.lower()
            is_referential = any(re.search(rf"\b{re.escape(w)}\b", q_lower) for w in referential_markers) or len(query.split()) < 6
            if is_referential:
                prev_user_queries = [
                    (getattr(m, "content", None) or (m.get("content") if isinstance(m, dict) else ""))
                    for m in history
                    if (getattr(m, "role", None) or (m.get("role") if isinstance(m, dict) else "")) == "user"
                ]
                if prev_user_queries:
                    last_q = prev_user_queries[-1].strip()
                    search_text = f"{last_q} {query}"
                    print(f"🧠 [Brain Search Contextualized] '{query}' -> '{search_text}'")

        # Embed query with FastEmbed ONNX
        query_vector = self.get_embedding(search_text)

        try:
            if query_vector:
                raw = self.collection.query(
                    query_embeddings=[query_vector],
                    n_results=25,
                    where=final_filters if final_filters else None
                )
            else:
                raw = self.collection.query(
                    query_texts=[search_text],
                    n_results=25,
                    where=final_filters if final_filters else None
                )
        except Exception as e:
            print(f"[Brain Search Error] {e}")
            return {'documents': [[]], 'metadatas': [[]]}

        docs = raw['documents'][0] if raw.get('documents') and raw['documents'][0] else []
        metas = raw['metadatas'][0] if raw.get('metadatas') and raw['metadatas'][0] else []

        if not docs:
            return {'documents': [[]], 'metadatas': [[]]}

        # Check if a specific scripture was targeted
        is_filtered_by_scripture = False
        if final_filters:
            if isinstance(final_filters, dict):
                if final_filters.get("scripture") or any("scripture" in c for c in final_filters.get("$and", [])):
                    is_filtered_by_scripture = True

        seen_keys = set()
        if is_filtered_by_scripture:
            deduped_docs = []
            deduped_metas = []
            for d, m in zip(docs, metas):
                sc = m.get("scripture", "vachanamrut")
                key = f"{sc}_{m.get('chapter')}_{m.get('vachanamrut_no')}_{m.get('prakran_no')}_{m.get('vat_no')}_{m.get('shlok_no')}"
                if key not in seen_keys:
                    seen_keys.add(key)
                    deduped_docs.append(d)
                    deduped_metas.append(m)
                if len(deduped_docs) >= 6:
                    break
            return {'documents': [deduped_docs], 'metadatas': [deduped_metas]}

        # When searching across 'All' scriptures, balance representation
        vach_items = []
        sv_items = []
        sp_items = []

        for d, m in zip(docs, metas):
            sc = m.get("scripture", "vachanamrut")
            key = f"{sc}_{m.get('chapter')}_{m.get('vachanamrut_no')}_{m.get('prakran_no')}_{m.get('vat_no')}_{m.get('shlok_no')}"
            if key in seen_keys:
                continue
            seen_keys.add(key)

            if sc == "vachanamrut":
                vach_items.append((d, m))
            elif sc == "swamini_vato":
                sv_items.append((d, m))
            elif sc == "shikshapatri":
                sp_items.append((d, m))

        final_items = []
        # Take up to 3 Vachanamruts
        final_items.extend(vach_items[:3])
        # Take up to 2-3 Swamini Vato discourses
        final_items.extend(sv_items[:2])
        # Take up to 1 Shikshapatri shlok if available
        if sp_items:
            final_items.extend(sp_items[:1])
        
        # If we still have slots (< 6), fill from any remaining top matches
        if len(final_items) < 6:
            remaining = [item for item in (vach_items[3:] + sv_items[2:] + sp_items[1:]) if item not in final_items]
            final_items.extend(remaining[:6 - len(final_items)])

        final_docs = [item[0] for item in final_items]
        final_metas = [item[1] for item in final_items]

        return {'documents': [final_docs], 'metadatas': [final_metas]}

    def _build_messages(self, system_prompt: str, user_prompt: str, history: list = None):
        """Constructs multi-turn conversational messages list preserving previous context."""
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            # Include recent conversation turns (up to last 6 messages)
            for msg in history[-6:]:
                role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
                content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
                # Ignore initial greeting boilerplate
                if content and not ("Jay Swaminarayan" in content and role == "assistant" and len(content) < 160):
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_prompt})
        return messages

    def _build_gemini_prompt(self, system_prompt: str, user_prompt: str, history: list = None):
        """Constructs prompt for Gemini incorporating conversational history."""
        if not history:
            return f"{system_prompt}\n\n{user_prompt}"
        
        hist_text = ""
        for msg in history[-6:]:
            role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
            if content and not ("Jay Swaminarayan" in content and role == "assistant" and len(content) < 160):
                hist_text += f"{role.upper()}: {content}\n\n"
        
        if hist_text.strip():
            return f"{system_prompt}\n\n=== CONVERSATION HISTORY ===\n{hist_text}=== CURRENT QUESTION & CONTEXT ===\n{user_prompt}"
        return f"{system_prompt}\n\n{user_prompt}"

    def generate_answer(self, system_prompt: str, user_prompt: str, history: list = None) -> str:
        """Generate spiritual response using Multi-Provider Cascade: FreeLLMAPI -> Groq -> Gemini -> Ollama."""
        messages = self._build_messages(system_prompt, user_prompt, history)
        gemini_prompt = self._build_gemini_prompt(system_prompt, user_prompt, history)

        # Tier 1: Try FreeLLMAPI Unified Gateway (34 free providers with auto-failover)
        if self.freellm_client:
            try:
                completion = self.freellm_client.chat.completions.create(
                    model="auto",
                    messages=messages,
                    temperature=0.3
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"[Brain] FreeLLMAPI failed: {e}. Failing over...")

        # Tier 2: Try Groq Cloud (Fastest - 300+ tokens/sec)
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.3,
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"[Brain] Groq failed / rate-limited: {e}. Failing over to Gemini...")

        # Tier 3: Try Google Gemini Cloud (Direct Fallback)
        if self.gemini_client:
            try:
                res = self.gemini_client.generate_content(gemini_prompt)
                if res.text:
                    return res.text
            except Exception as e:
                print(f"[Brain] Gemini failed: {e}. Failing over to local Ollama...")

        # Tier 4: Try Local Ollama (Emergency Offline Fallback)
        if self.ollama_available and self.ollama_client:
            try:
                res = self.ollama_client.chat(
                    model=self.ollama_chat_model,
                    messages=messages,
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

        return "I apologize, but all AI providers (FreeLLMAPI, Groq, Gemini, and local Ollama) are currently unreachable. Please check your API keys or local services."

    def stream_answer(self, system_prompt: str, user_prompt: str, history: list = None):
        """Streams answer token-by-token using Multi-Provider Cascade: FreeLLMAPI -> Groq -> Gemini -> Ollama."""
        messages = self._build_messages(system_prompt, user_prompt, history)
        gemini_prompt = self._build_gemini_prompt(system_prompt, user_prompt, history)

        # Tier 1: Try FreeLLMAPI Unified Gateway (34 free providers with auto-failover)
        if self.freellm_client:
            try:
                stream = self.freellm_client.chat.completions.create(
                    model="auto",
                    messages=messages,
                    temperature=0.3,
                    stream=True
                )
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                return
            except Exception as e:
                print(f"[Brain] FreeLLMAPI stream failed: {e}. Failing over...")

        # Tier 2: Try Groq Cloud (Fastest - 300+ tokens/sec)
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.3,
                    stream=True
                )
                for chunk in completion:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield delta
                return
            except Exception as e:
                print(f"[Brain] Groq stream failed / rate-limited: {e}. Failing over to Gemini...")

        # Tier 3: Try Google Gemini Cloud (Failover)
        if self.gemini_client:
            try:
                response = self.gemini_client.generate_content(gemini_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                print(f"[Brain] Gemini stream failed: {e}. Failing over to local Ollama...")

        # Tier 4: Try Local Ollama (Emergency Offline Fallback)
        if self.ollama_available and self.ollama_client:
            try:
                stream = self.ollama_client.chat(
                    model=self.ollama_chat_model,
                    messages=messages,
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

        yield "Please provide a valid GROQ_API_KEY, GEMINI_API_KEY in `.env`, or ensure Ollama is running locally."


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = str(BASE_DIR / "Data" / "vachanamrut_db")
brain_service = Brain(db_path=DB_PATH)