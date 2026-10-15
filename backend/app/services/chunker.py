"""
Nididhya - Multi-Topology Semantic Scripture Chunker
===================================================
Production-grade chunking pipeline implementing:
1. Dialogue-Turn Semantic Chunking for Vachanamrut (Parent-Context Inheritance)
2. Atomic Maxim Chunking with Sandarbh for Swamini Vato
3. Couplet-Commentary Chunking for Shikshapatri
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional


class ScriptureChunker:
    def __init__(self):
        # Patterns for detecting new dialogue turns / questions in English Vachanamrut
        self.en_turn_pattern = re.compile(
            r'(?:Thereupon|Thereafter,?|Then|After this|At that time|Following this|Subsequently,?)\s+'
            r'(?:the devotee\s+|the sadhu\s+|the swami\s+)?([A-Za-z\s’\.\-\u0100-\u017F]+?)\s+'
            r'(?:asked|inquired|questioned|said to Shriji Mah\u0101r\u0101j)',
            re.IGNORECASE
        )

        # Patterns for detecting questions in Gujarati Vachanamrut
        self.gu_turn_pattern = re.compile(
            r'(?:^|\n\n)(?:પછી|ત્યાર પછી|તે પછી|વળી|એમ કહીને)\s+(?:હરિભક્ત\s+|મુનિ\s+|સાધુ\s+)?([^\s,]+(?:સ્વામીએ|ભક્તે|શેઠે|ભાઈએ|રાજાએ|મહારાજે|બાપુએ)?)\s+(?:પ્રશ્ન પૂછ્યું|પૂછ્યું|કહ્યું જે)',
            re.MULTILINE
        )

    # -------------------------------------------------------------------------
    # 1. VACHANAMRUT CHUNKING (Dialogue-Turn Boundary Segmentation)
    # -------------------------------------------------------------------------
    def chunk_vachanamrut_discourse(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Segments a single Vachanamrut into:
        - Assembly Context chunk (Setting, date, location, attendees)
        - 1..N Dialogue Turn chunks (Specific Q&A pairs)
        All chunks inherit the parent discourse metadata.
        """
        chunks = []
        doc_id = doc.get("id") or str(doc.get("vachanamrut_no", ""))
        chapter = doc.get("chapter", "")
        section = doc.get("section", "")
        vac_no = doc.get("vachanamrut_no", 0)
        title_en = doc.get("title_en", "")
        title_gu = doc.get("title_gu", "")
        tithi = doc.get("tithi", "")
        panchang = doc.get("panchang_date", "")

        raw_en = doc.get("text_en", "")
        raw_gu = doc.get("text_gu", "")
        paragraphs_en = [p.strip() for p in raw_en.split("\n\n") if p.strip()]

        if not paragraphs_en:
            return []

        # Paragraph 1 is always the Assembly Setting
        sabha_setting_en = paragraphs_en[0]
        parent_meta = {
            "scripture": "vachanamrut",
            "parent_id": f"vac_{chapter}_{section}_{vac_no}".lower().replace(" ", "_"),
            "chapter": chapter,
            "section": section,
            "vachanamrut_no": vac_no,
            "title_en": title_en,
            "title_gu": title_gu,
            "tithi": tithi,
            "panchang_date": panchang,
        }

        # Identify question starting indices
        turn_starts = []
        for idx in range(1, len(paragraphs_en)):
            para = paragraphs_en[idx]
            # Check if this paragraph contains a question or starts a new turn
            is_turn = bool(
                self.en_turn_pattern.search(para) or
                "asked," in para[:80] or
                "inquired," in para[:80] or
                "asked Shriji" in para[:80] or
                "asked Mah\u0101r\u0101j" in para[:80] or
                "Thereupon Shriji Mah\u0101r\u0101j said" in para[:80] or
                "Shriji Mah\u0101r\u0101j said," in para[:80]
            )
            if is_turn:
                turn_starts.append(idx)

        # If no explicit question turns detected, group into 2-3 logical paragraphs per chunk
        if not turn_starts:
            # Assembly Setting chunk
            chunks.append({
                "chunk_id": f"vac_{chapter}_{section}_{vac_no}_context".lower().replace(" ", "_"),
                "chunk_type": "assembly_context",
                "turn_index": 0,
                **parent_meta,
                "vector_text": f"Vachanamrut {chapter} {section} {vac_no} - {title_en}. Assembly setting: {sabha_setting_en}",
                "content_en": sabha_setting_en,
                "content_gu": raw_gu[:400] if raw_gu else "",
                "speaker": "Narrator",
                "questioner": ""
            })

            # Discourse body chunks
            step = 3
            body_paras = paragraphs_en[1:]
            for b_idx in range(0, len(body_paras), step):
                chunk_slice = body_paras[b_idx : b_idx + step]
                chunk_text = "\n\n".join(chunk_slice)
                chunk_no = (b_idx // step) + 1
                chunks.append({
                    "chunk_id": f"vac_{chapter}_{section}_{vac_no}_turn{chunk_no}".lower().replace(" ", "_"),
                    "chunk_type": "discourse_body",
                    "turn_index": chunk_no,
                    **parent_meta,
                    "vector_text": f"Vachanamrut {chapter} {section} {vac_no}: {title_en}. {chunk_text}",
                    "content_en": chunk_text,
                    "content_gu": "",
                    "speaker": "Shriji Maharaj",
                    "questioner": ""
                })
            return chunks

        # Assemble Dialogue Turns
        # Turn 0: Setting
        chunks.append({
            "chunk_id": f"vac_{chapter}_{section}_{vac_no}_context".lower().replace(" ", "_"),
            "chunk_type": "assembly_context",
            "turn_index": 0,
            **parent_meta,
            "vector_text": f"Vachanamrut {chapter} {section} {vac_no} - {title_en}. Assembly setting: {sabha_setting_en}",
            "content_en": sabha_setting_en,
            "content_gu": raw_gu[:400] if raw_gu else "",
            "speaker": "Narrator",
            "questioner": ""
        })

        # Assemble each Q&A Turn
        turn_starts.append(len(paragraphs_en)) # boundary sentinel
        for t_idx in range(len(turn_starts) - 1):
            start = turn_starts[t_idx]
            end = turn_starts[t_idx + 1]
            turn_paras = paragraphs_en[start:end]
            turn_text = "\n\n".join(turn_paras)
            turn_num = t_idx + 1

            # Extract questioner name if present in the first paragraph
            q_match = self.en_turn_pattern.search(turn_paras[0])
            questioner = q_match.group(1).strip() if q_match else "Devotee"
            if "Shriji Mah\u0101r\u0101j" in questioner:
                questioner = "Shriji Maharaj (Self-question)"

            # Tier 2 Guardrail: If turn exceeds 1800 characters (~450 tokens), subdivide into sub-chunks
            MAX_TURN_CHARS = 1800
            if len(turn_text) > MAX_TURN_CHARS and len(turn_paras) > 2:
                # Subdivide by paragraph batches
                batch = []
                batch_len = 0
                part_idx = 1
                for p in turn_paras:
                    if batch and (batch_len + len(p) > MAX_TURN_CHARS):
                        sub_text = "\n\n".join(batch)
                        v_text = f"Vachanamrut {chapter} {section} {vac_no} ({title_en}). Question by {questioner} (Part {part_idx}). {sub_text}"
                        chunks.append({
                            "chunk_id": f"vac_{chapter}_{section}_{vac_no}_turn{turn_num}_p{part_idx}".lower().replace(" ", "_"),
                            "chunk_type": "dialogue_turn",
                            "turn_index": turn_num,
                            "part_index": part_idx,
                            **parent_meta,
                            "vector_text": v_text,
                            "content_en": sub_text,
                            "content_gu": "",
                            "speaker": "Shriji Maharaj",
                            "questioner": questioner
                        })
                        part_idx += 1
                        batch = [p]
                        batch_len = len(p)
                    else:
                        batch.append(p)
                        batch_len += len(p)
                if batch:
                    sub_text = "\n\n".join(batch)
                    v_text = f"Vachanamrut {chapter} {section} {vac_no} ({title_en}). Question by {questioner} (Part {part_idx}). {sub_text}"
                    chunks.append({
                        "chunk_id": f"vac_{chapter}_{section}_{vac_no}_turn{turn_num}_p{part_idx}".lower().replace(" ", "_"),
                        "chunk_type": "dialogue_turn",
                        "turn_index": turn_num,
                        "part_index": part_idx,
                        **parent_meta,
                        "vector_text": v_text,
                        "content_en": sub_text,
                        "content_gu": "",
                        "speaker": "Shriji Maharaj",
                        "questioner": questioner
                    })
            else:
                vector_text = (
                    f"Vachanamrut {chapter} {section} {vac_no} ({title_en}). "
                    f"Question by {questioner}. {turn_text}"
                )
                chunks.append({
                    "chunk_id": f"vac_{chapter}_{section}_{vac_no}_turn{turn_num}".lower().replace(" ", "_"),
                    "chunk_type": "dialogue_turn",
                    "turn_index": turn_num,
                    "part_index": 1,
                    **parent_meta,
                    "vector_text": vector_text,
                    "content_en": turn_text,
                    "content_gu": "",
                    "speaker": "Shriji Maharaj",
                    "questioner": questioner
                })

        return chunks

    # -------------------------------------------------------------------------
    # 2. SWAMINI VATO CHUNKING (Atomic Maxim with Sandarbh)
    # -------------------------------------------------------------------------
    def chunk_swamini_vato(self, vat: Dict[str, Any]) -> Dict[str, Any]:
        """
        A single Swamini Vat is an atomic unit of thought (1–3 paragraphs).
        Enriches the chunk with transliterated title, Gujarati text, and Sandarbh commentary.
        """
        prakran_no = vat.get("prakran_no", 1)
        prakran_name = vat.get("prakran_name", f"Prakaran {prakran_no}")
        vat_no = vat.get("vat_no", 1)
        title_gu = vat.get("title_gu", "")
        title_en = vat.get("title_en", "")
        text_gu = vat.get("text_gu", "")
        text_en = vat.get("text_en", "")
        sandarbh = vat.get("sandarbh", "")

        # Build clean vector representation
        vector_components = [
            f"Swamini Vato {prakran_no}.{vat_no} ({prakran_name}).",
            f"Title: {title_en} / {title_gu}."
        ]
        if text_en:
            vector_components.append(text_en)
        if text_gu:
            vector_components.append(f"Gujarati: {text_gu}")
        if sandarbh:
            vector_components.append(f"Sandarbh Commentary: {sandarbh}")

        vector_text = " ".join(vector_components)

        return {
            "chunk_id": f"sv_prakran_{prakran_no}_vat_{vat_no}".lower(),
            "chunk_type": "swamini_vat_maxim",
            "scripture": "swamini_vato",
            "prakran_no": prakran_no,
            "prakran_name": prakran_name,
            "vat_no": vat_no,
            "title_en": title_en,
            "title_gu": title_gu,
            "vector_text": vector_text,
            "content_en": text_en,
            "content_gu": text_gu,
            "sandarbh": sandarbh,
            "speaker": "Gunatitanand Swami"
        }

    # -------------------------------------------------------------------------
    # 3. SHIKSHAPATRI CHUNKING (Couplet + Bhashya Unit)
    # -------------------------------------------------------------------------
    def chunk_shikshapatri(self, shlok: Dict[str, Any]) -> Dict[str, Any]:
        """
        Each Shikshapatri Shlok is an atomic ethical code.
        Binds Sanskrit shlok, Gujarati translation, and bhashya commentary.
        """
        shlok_no = shlok.get("shlok_no", 1)
        shlok_sanskrit = shlok.get("shlok_sanskrit", "")
        trans_gu = shlok.get("trans_gu", "")
        bhashya_gu = shlok.get("bhashya_gu", "")
        bhashya_hi = shlok.get("bhashya_hi", "")
        category = shlok.get("category", "")

        vector_parts = [f"Shikshapatri Shlok {shlok_no}."]
        if category:
            vector_parts.append(f"Category: {category}.")
        if shlok_sanskrit:
            vector_parts.append(f"Sanskrit: {shlok_sanskrit}.")
        if bhashya_gu:
            vector_parts.append(f"Gujarati: {bhashya_gu}.")
        if bhashya_hi:
            vector_parts.append(f"Hindi: {bhashya_hi}.")

        vector_text = " ".join(vector_parts)

        return {
            "chunk_id": f"sp_shlok_{shlok_no}".lower(),
            "chunk_type": "shikshapatri_shlok",
            "scripture": "shikshapatri",
            "shlok_no": shlok_no,
            "category": category,
            "vector_text": vector_text,
            "shlok_sanskrit": shlok_sanskrit,
            "content_gu": trans_gu,
            "bhashya_gu": bhashya_gu,
            "bhashya_hi": bhashya_hi,
            "speaker": "Bhagwan Swaminarayan"
        }


# Singleton instance
chunker_service = ScriptureChunker()

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    base_dir = Path(__file__).resolve().parent.parent.parent
    vac_path = base_dir / "Data" / "vachanamrut_master.json"

    print("=== Testing Dialogue-Turn Chunking on Full Vachanamrut Dataset ===")
    with open(vac_path, "r", encoding="utf-8") as f:
        vac_data = json.load(f)

    all_vac_chunks = []
    questioners_found = set()

    for d in vac_data:
        c_list = chunker_service.chunk_vachanamrut_discourse(d)
        all_vac_chunks.extend(c_list)
        for c in c_list:
            if c.get("questioner"):
                questioners_found.add(c["questioner"])

    lengths = [len(c["vector_text"]) for c in all_vac_chunks]
    avg_len = sum(lengths) / len(lengths)

    print(f"Total Vachanamrut Discourses: {len(vac_data)}")
    print(f"Total Chunks Generated:       {len(all_vac_chunks)}")
    print(f"Average Chunk Length:         {avg_len:.1f} characters (~{int(avg_len/4)} tokens)")
    print(f"Min Chunk Length:             {min(lengths)} characters")
    print(f"Max Chunk Length:             {max(lengths)} characters")
    print(f"Unique Questioners Detected:  {len(questioners_found)}")
    print(f"Sample Questioners:           {list(questioners_found)[:10]}")

    # Evaluate Swamini Vato
    sv_path = base_dir / "Data" / "swamini_vato_master.json"
    if sv_path.exists():
        print("\n=== Testing Atomic Maxim Chunking on Swamini Vato ===")
        with open(sv_path, "r", encoding="utf-8") as f:
            sv_data = json.load(f)
        sv_chunks = [chunker_service.chunk_swamini_vato(v) for v in sv_data]
        sv_lengths = [len(c["vector_text"]) for c in sv_chunks]
        sv_avg = sum(sv_lengths) / len(sv_lengths)
        print(f"Total Swamini Vato Discourses: {len(sv_data)}")
        print(f"Total Chunks Generated:        {len(sv_chunks)}")
        print(f"Average Chunk Length:          {sv_avg:.1f} characters (~{int(sv_avg/4)} tokens)")

    # Evaluate Shikshapatri
    sp_path = base_dir / "Data" / "shikshapatri_master.json"
    if sp_path.exists():
        print("\n=== Testing Couplet Chunking on Shikshapatri ===")
        with open(sp_path, "r", encoding="utf-8") as f:
            sp_data = json.load(f)
        sp_chunks = [chunker_service.chunk_shikshapatri(s) for s in sp_data]
        sp_lengths = [len(c["vector_text"]) for c in sp_chunks]
        sp_avg = sum(sp_lengths) / len(sp_lengths)
        print(f"Total Shikshapatri Shlokas:    {len(sp_data)}")
        print(f"Total Chunks Generated:        {len(sp_chunks)}")
        print(f"Average Chunk Length:          {sp_avg:.1f} characters (~{int(sp_avg/4)} tokens)")

    print(f"\n=======================================================")
    print(f"TOTAL MULTI-SCRIPTURE CHUNKS: {len(all_vac_chunks) + len(sv_chunks) + len(sp_chunks)}")
    print(f"=======================================================")
