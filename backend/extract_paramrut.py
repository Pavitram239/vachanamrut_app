import zipfile
import io
import json
import os
import re
import sys
import sqlite3
from pathlib import Path

# Fix Windows console UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

APKS_PATH = r"C:\Users\pavit\Downloads\Paramrut_5.1_apkcube.apks"
OUTPUT_DIR = Path(r"c:\Users\pavit\Desktop\Career\Projects\vachanamrut_app\backend\Data")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def clean_html(raw_html):
    if not raw_html:
        return ""
    # remove style and script blocks
    clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', raw_html, flags=re.DOTALL | re.IGNORECASE)
    # remove html tags
    clean = re.sub(r'<[^>]+>', ' ', clean)
    # normalize spaces
    clean = re.sub(r'[ \t]+', ' ', clean)
    clean = re.sub(r'\n\s*\n+', '\n\n', clean)
    return clean.strip()

def extract_all():
    print(f"📦 Opening APKS at: {APKS_PATH}")
    with zipfile.ZipFile(APKS_PATH) as z_apks:
        base_data = z_apks.read("base.apk")
    
    with zipfile.ZipFile(io.BytesIO(base_data)) as z_base:
        names = set(z_base.namelist())
        print(f"📂 Total files inside base.apk: {len(names)}")

        # -----------------------------------------------------------------
        # 1. EXTRACT SWAMINI VATO & SANDARBH
        # -----------------------------------------------------------------
        print("\n--- 1. Extracting Swamini Vato & Sandarbh ---")
        db_data = z_base.read("assets/flutter_assets/assets/vato.sqlite")
        conn = sqlite3.connect(":memory:")
        conn.deserialize(db_data)
        cur = conn.cursor()
        cur.execute("SELECT id, chid, chname, vatid, vattitle, vathtml, vattags FROM vato ORDER BY id")
        rows = cur.fetchall()

        # Read vato1.sqlite for transliterated English titles if available
        vato1_titles = {}
        if "assets/flutter_assets/assets/vato1.sqlite" in names:
            db1_data = z_base.read("assets/flutter_assets/assets/vato1.sqlite")
            conn1 = sqlite3.connect(":memory:")
            conn1.deserialize(db1_data)
            cur1 = conn1.cursor()
            cur1.execute("SELECT id, vattitle FROM vato")
            for vid, vt in cur1.fetchall():
                vato1_titles[vid] = vt

        # Read vato.json for ref file mappings
        ref_mappings = {}
        if "assets/flutter_assets/assets/vato.json" in names:
            vato_json = json.loads(z_base.read("assets/flutter_assets/assets/vato.json").decode("utf-8"))
            for item in vato_json:
                vid = item.get("VatId")
                rf = item.get("RefFile")
                if vid and rf:
                    ref_mappings[vid] = rf

        swamini_vato_list = []
        sandarbh_cache = {}

        for row in rows:
            row_id, chid, chname, vatid, vattitle, vathtml, vattags = row
            clean_text = clean_html(vathtml)

            # Check for Sandarbh commentary
            sandarbh_text = ""
            ref_file = ref_mappings.get(row_id)
            if ref_file:
                # ref files are inside html/chapter{chid}/refch...html
                potential_paths = [
                    f"assets/flutter_assets/assets/html/chapter{chid}/{ref_file}",
                    f"assets/flutter_assets/assets/html/{ref_file}",
                    f"assets/flutter_assets/assets/html1/{ref_file}"
                ]
                for p in potential_paths:
                    if p in names:
                        if p not in sandarbh_cache:
                            raw_ref = z_base.read(p).decode("utf-8", errors="ignore")
                            sandarbh_cache[p] = clean_html(raw_ref)
                        sandarbh_text = sandarbh_cache[p]
                        break

            # Check for English translation if available in textenglish
            # chid formatted as 2 digits, vatid as 4 digits e.g. chapter1/ch01001.txt
            eng_text = ""
            try:
                ch_int = int(chid)
                v_int = int(vatid)
                eng_path = f"assets/flutter_assets/assets/textenglish/chapter{ch_int}/ch{ch_int:02d}{v_int:03d}.txt"
                if eng_path in names:
                    eng_text = z_base.read(eng_path).decode("utf-8", errors="ignore").strip()
            except Exception:
                pass

            item = {
                "id": row_id,
                "scripture": "swamini_vato",
                "prakran_no": int(chid) if chid.isdigit() else chid,
                "prakran_name": chname,
                "vat_no": int(vatid) if vatid.isdigit() else vatid,
                "title_gu": clean_html(vattitle),
                "title_en": vato1_titles.get(row_id, ""),
                "text_gu": clean_text,
                "text_en": eng_text,
                "sandarbh": sandarbh_text,
                "tags": vattags if vattags and vattags != "nan" else ""
            }
            swamini_vato_list.append(item)

        out_sv = OUTPUT_DIR / "swamini_vato_master.json"
        with open(out_sv, "w", encoding="utf-8") as f:
            json.dump(swamini_vato_list, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved {len(swamini_vato_list)} Swamini Vato to {out_sv}")

        # -----------------------------------------------------------------
        # 2. EXTRACT VACHANAMRUT (TAGGED TEXT & PANCHANG DATES)
        # -----------------------------------------------------------------
        print("\n--- 2. Extracting Vachanamrut ---")
        vachan_meta = json.loads(z_base.read("assets/flutter_assets/assets/vachanall.json").decode("utf-8"))
        
        # Load existing cleaned vachanamrut for English & Hindi translations
        existing_path = OUTPUT_DIR / "vachanamrut_cleaned.json"
        existing_data = []
        if existing_path.exists():
            with open(existing_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)

        vachanamrut_list = []
        for i, vm in enumerate(vachan_meta):
            vid = vm.get("Id")
            vname = vm.get("VachanName")
            vfile = vm.get("File")
            tithi = vm.get("Tithi", "").strip()
            panchang = vm.get("Panchang", "").strip()
            day = vm.get("Day", "").strip()
            name_guj = vm.get("NameGuj", "").strip()
            vno = vm.get("VachanNo", "").strip()

            parts = vname.split()
            chapter = parts[0]
            section = parts[1] if len(parts) > 2 else ""
            num = int(parts[-1]) if parts[-1].isdigit() else vno

            txt_file = vfile.replace(".html", ".txt")
            txt_path = f"assets/flutter_assets/assets/textvachan/{txt_file}"
            
            title_text = ""
            slok_text = ""
            body_text = ""

            if txt_path in names:
                raw_txt = z_base.read(txt_path).decode("utf-8", errors="ignore")
                # Parse ${Title} ... $
                t_match = re.search(r'\$\{Title\}(.*?)\$', raw_txt, re.DOTALL)
                if t_match:
                    title_text = t_match.group(1).strip()
                # Parse ${Slok} ... $
                s_match = re.search(r'\$\{Slok\}(.*?)\$', raw_txt, re.DOTALL)
                if s_match:
                    slok_text = s_match.group(1).replace("${Slok}", " ").strip()
                # Body is everything after the last $
                last_dollar = raw_txt.rfind("$")
                if last_dollar != -1 and last_dollar + 1 < len(raw_txt):
                    body_text = raw_txt[last_dollar + 1:].strip()
                else:
                    body_text = raw_txt.strip()

            # Merge with English & Hindi from existing dataset matching 1-to-1 by order
            ex = existing_data[i] if i < len(existing_data) else {}

            v_item = {
                "id": vid,
                "scripture": "vachanamrut",
                "chapter": chapter,
                "section": section,
                "vachanamrut_no": int(num) if str(num).isdigit() else num,
                "title_gu": title_text or name_guj,
                "title_en": ex.get("title_en", vname),
                "title_hi": ex.get("title_hi", ""),
                "dhyan_slok": slok_text,
                "text_gu": ex.get("text_gu", body_text),
                "text_en": ex.get("text_en", ""),
                "text_hi": ex.get("text_hi", ""),
                "tithi": tithi,
                "panchang_date": panchang,
                "day": day
            }
            vachanamrut_list.append(v_item)

        out_vach = OUTPUT_DIR / "vachanamrut_master.json"
        with open(out_vach, "w", encoding="utf-8") as f:
            json.dump(vachanamrut_list, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved {len(vachanamrut_list)} Vachanamruts to {out_vach}")

        # -----------------------------------------------------------------
        # 3. EXTRACT VISHAYVAR (TOPICS & MAPPINGS)
        # -----------------------------------------------------------------
        print("\n--- 3. Extracting Vishayvar (Topics) ---")
        if "assets/flutter_assets/assets/vishayvar.json" in names:
            vishay_data = json.loads(z_base.read("assets/flutter_assets/assets/vishayvar.json").decode("utf-8"))
            topics_list = []
            for item in vishay_data:
                vat_ids = [int(x.strip()) for x in item.get("VatId", "").split(",") if x.strip().isdigit()]
                topics_list.append({
                    "id": item.get("Id"),
                    "name_en": item.get("Name", "").strip(),
                    "name_gu": item.get("NameGuj", "").strip(),
                    "linked_vat_ids": vat_ids
                })
            out_topics = OUTPUT_DIR / "topics_vishayvar.json"
            with open(out_topics, "w", encoding="utf-8") as f:
                json.dump(topics_list, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved {len(topics_list)} Topics to {out_topics}")

        # -----------------------------------------------------------------
        # 4. EXTRACT SHIKSHAPATRI
        # -----------------------------------------------------------------
        print("\n--- 4. Extracting Shikshapatri ---")
        if "assets/flutter_assets/assets/shikshapatri.json" in names:
            sp_gu = json.loads(z_base.read("assets/flutter_assets/assets/shikshapatri.json").decode("utf-8"))
            sp_hi = []
            if "assets/flutter_assets/assets/shikshapatrihindi.json" in names:
                sp_hi = json.loads(z_base.read("assets/flutter_assets/assets/shikshapatrihindi.json").decode("utf-8"))
            
            # Map Hindi by Shlok Number
            hi_map = {}
            for h in sp_hi:
                sno = h.get("number")
                if sno is not None:
                    hi_map[int(sno)] = h.get("content", "").strip()

            shikshapatri_list = []
            for item in sp_gu:
                sno = item.get("number")
                if sno is None:
                    continue
                s_int = int(sno)
                sanskrit_text = clean_html(item.get("sanskrit", ""))
                guj_text = clean_html(item.get("gujarati", ""))
                hi_text = clean_html(hi_map.get(s_int, ""))

                shikshapatri_list.append({
                    "scripture": "shikshapatri",
                    "shlok_no": s_int,
                    "shlok_sanskrit": sanskrit_text,
                    "bhashya_gu": guj_text,
                    "bhashya_hi": hi_text
                })

            out_sp = OUTPUT_DIR / "shikshapatri_master.json"
            with open(out_sp, "w", encoding="utf-8") as f:
                json.dump(shikshapatri_list, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved {len(shikshapatri_list)} Shikshapatri Shlokas to {out_sp}")

if __name__ == "__main__":
    extract_all()
