# Nididhya (નિદિધ્યા)
> *From Reading to Realization — Sacred Scriptures & AI Spiritual Companion*

A full-stack spiritual exploration platform uniting the divine discourses of **Vachanamrut**, **Swamini Vato** (with Sandarbh commentary), **Shikshapatri**, and **Thematic Explorer (Vishayvar)** with a Retrieval-Augmented Generation (RAG) AI assistant.

Built with **Python FastAPI** on the backend and **React + Vite** on the frontend, featuring both light parchment and temple dark themes.

---

## 🌟 Features

- **📖 Vachanamrut (૨૭૪ વચનામૃત)**:
  - Trilingual discourse reading (Gujarati, English, Hindi)
  - Sanskrit Dhyan Shlok formatting
  - Authentic Hindu Tithi and Gregorian Panchang dates
  - Section filtering (Gadhada I/II/III, Sarangpur, Kariyani, Loya, Panchala, Vartal, Amdavad, etc.)
- **📿 Swamini Vato (૩,૮૨૫ વાતો)**:
  - All 16 Prakrans with Gujarati & English texts
  - **Sandarbh (સંદર્ભ) Commentary**: Deep scriptural commentary linking discourses directly to the Gita, Upanishads, and Vachanamrut
- **🏷️ Thematic Explorer (વિષયવાર - 33 Topics)**:
  - 33 curated spiritual categories (e.g. *Sarvopari Bhagavan*, *Sadhuno Mahima*, *Nishchay*, *Vairagya*) mapped to discourse IDs
- **📜 Shikshapatri (૨૧૨ શ્લોકો)**:
  - Original Sanskrit verses with Gujarati and Hindi bhashya commentary
- **🤖 AI Spiritual Companion (RAG Assistant)**:
  - Conversational Q&A grounded in scripture with deep-linked citations
- **🎨 Responsive Theme System (Figma-Aligned)**:
  - Light (Parchment & Saffron) and Dark (Temple Night & Warm Gold) modes
  - Dynamic font-size scaling ($A- / A+$)
  - Desktop two-pane split views and mobile bottom-navigation drawer

---

## 🚀 Running the Project

### 1. Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 10000 --reload
```
API runs on `http://localhost:10000` (Swagger docs available at `http://localhost:10000/docs`).

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
App opens on `http://localhost:5173`.

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/schemas.py        # Pydantic data models
│   │   └── services/
│   │       ├── brain.py             # Vector search, Router & Groq RAG
│   │       └── librarian.py         # Knowledge base & multi-scripture loader
│   ├── Data/
│   │   ├── vachanamrut_master.json  # 274 Vachanamruts (Trilingual + Panchang)
│   │   ├── swamini_vato_master.json # 3,825 Swamini Vato + Sandarbh
│   │   ├── topics_vishayvar.json    # 33 Thematic topics
│   │   └── shikshapatri_master.json # 212 Shlokas (Sanskrit + Bhashya)
│   ├── extract_paramrut.py          # Master dataset extractor
│   └── main.py                      # FastAPI REST endpoints
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.jsx           # Responsive header & mobile bottom nav
        │   ├── HomeView.jsx         # Spiritual discovery dashboard
        │   ├── VachanamrutView.jsx  # Vachanamrut reader & browser
        │   ├── SwaminiVatoView.jsx  # Swamini Vato 16 Prakrans & Sandarbh
        │   ├── TopicsView.jsx       # 33 Curated Vishayvar themes
        │   ├── ShikshapatriView.jsx # 212 Shlokas browser
        │   ├── ChatPanel.jsx        # AI conversational companion
        │   └── ReadingPanel.jsx     # Slide-over scripture reader
        ├── App.jsx                  # Main application orchestrator
        └── index.css                # Central theme tokens & typography
```
