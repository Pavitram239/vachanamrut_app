import json
import os
from pathlib import Path

# Resolve base Data directory reliably on all OS platforms (Windows, Linux, Docker)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "Data"

class Librarian:
    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = data_dir
        self.vachanamrut_data = []
        self.swamini_vato_data = []
        self.topics_data = []
        self.shikshapatri_data = []
        self.load_all_data()

    def load_all_data(self):
        # 1. Load Vachanamrut
        vach_file = self.data_dir / "vachanamrut_master.json"
        if not vach_file.exists():
            vach_file = self.data_dir / "vachanamrut_cleaned.json"

        if vach_file.exists():
            with open(vach_file, 'r', encoding='utf-8') as f:
                self.vachanamrut_data = json.load(f)
            print(f"[Librarian] Loaded {len(self.vachanamrut_data)} Vachanamruts from {vach_file.name}.")
        else:
            print(f"[Librarian Error] Vachanamrut file not found at {vach_file}")

        # 2. Load Swamini Vato
        sv_file = self.data_dir / "swamini_vato_master.json"
        if sv_file.exists():
            with open(sv_file, 'r', encoding='utf-8') as f:
                self.swamini_vato_data = json.load(f)
            print(f"[Librarian] Loaded {len(self.swamini_vato_data)} Swamini Vato discourses.")
        else:
            print(f"[Librarian Warning] Swamini Vato file not found at {sv_file}")

        # 3. Load Topics
        topics_file = self.data_dir / "topics_vishayvar.json"
        if topics_file.exists():
            with open(topics_file, 'r', encoding='utf-8') as f:
                self.topics_data = json.load(f)
            print(f"[Librarian] Loaded {len(self.topics_data)} Topics.")

        # 4. Load Shikshapatri
        sp_file = self.data_dir / "shikshapatri_master.json"
        if sp_file.exists():
            with open(sp_file, 'r', encoding='utf-8') as f:
                self.shikshapatri_data = json.load(f)
            print(f"[Librarian] Loaded {len(self.shikshapatri_data)} Shikshapatri shlokas.")

    # --- Vachanamrut Lookups ---
    def get_all_vachanamrut_summaries(self):
        return [
            {
                "id": it.get("id"),
                "chapter": it.get("chapter"),
                "section": it.get("section"),
                "vachanamrut_no": it.get("vachanamrut_no"),
                "title_gu": it.get("title_gu"),
                "title_en": it.get("title_en"),
                "title_hi": it.get("title_hi"),
                "tithi": it.get("tithi"),
                "panchang_date": it.get("panchang_date"),
                "day": it.get("day")
            }
            for it in self.vachanamrut_data
        ]

    def get_full_text(self, chapter: str, section: str, number: int):
        search_section = "" if section in ["None", None, "All"] else str(section).strip()
        search_chapter = str(chapter).strip()

        for item in self.vachanamrut_data:
            item_ch = str(item.get("chapter", "")).strip()
            item_sec = str(item.get("section", "")).strip()
            item_no = int(item.get("vachanamrut_no", item.get("vachno", 0)))

            # Handle flexible matching for section
            sec_match = (
                item_sec.lower() == search_section.lower()
                or (search_section.lower() in ["i", "pratham"] and item_sec.lower() in ["i", "pratham"])
                or (search_section.lower() in ["ii", "madhya"] and item_sec.lower() in ["ii", "madhya"])
                or (search_section.lower() in ["iii", "antya"] and item_sec.lower() in ["iii", "antya"])
                or not search_section
            )

            if item_ch.lower() == search_chapter.lower() and sec_match and item_no == int(number):
                return item

        # Secondary search by chapter and number if section was omitted or mismatched
        for item in self.vachanamrut_data:
            item_ch = str(item.get("chapter", "")).strip()
            item_no = int(item.get("vachanamrut_no", item.get("vachno", 0)))
            if item_ch.lower() == search_chapter.lower() and item_no == int(number):
                return item

        return None

    # --- Swamini Vato Lookups ---
    def get_all_swaminivato_summaries(self, prakran_no: int = None):
        result = []
        for it in self.swamini_vato_data:
            p_no = it.get("prakran_no")
            if prakran_no is None or str(p_no) == str(prakran_no):
                result.append({
                    "id": it.get("id"),
                    "prakran_no": p_no,
                    "prakran_name": it.get("prakran_name"),
                    "vat_no": it.get("vat_no"),
                    "title_gu": it.get("title_gu"),
                    "title_en": it.get("title_en"),
                    "tags": it.get("tags"),
                    "has_sandarbh": bool(it.get("sandarbh"))
                })
        return result

    def get_swaminivato_vat(self, prakran_no: int, vat_no: int):
        for it in self.swamini_vato_data:
            if str(it.get("prakran_no")) == str(prakran_no) and str(it.get("vat_no")) == str(vat_no):
                return it
        return None

    # --- Topics Lookups ---
    def get_all_topics(self):
        return self.topics_data

    # --- Shikshapatri Lookups ---
    def get_all_shikshapatri(self):
        return self.shikshapatri_data

    def get_shikshapatri_shlok(self, shlok_no: int):
        for it in self.shikshapatri_data:
            if str(it.get("shlok_no")) == str(shlok_no):
                return it
        return None

librarian_service = Librarian()