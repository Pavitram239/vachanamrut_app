import React from "react";
import { BookOpen, ScrollText, Sparkles, Flame, ArrowRight, Sun, HeartHandshake } from "lucide-react";
import { useResponsive } from "../utils/useResponsive";

export default function HomeView({ onNavigate, lang }) {
  const { isMobile } = useResponsive();

  const scriptureCards = [
    {
      id: "vachanamrut",
      titleEn: "Vachanamrut",
      titleGu: "શ્રી વચનામૃત",
      descEn: "274 divine discourses delivered by Bhagwan Swaminarayan (1819–1829 CE) with authentic dialogue, dates, and Sanskrit dhyan shlokas.",
      descGu: "ભગવાન શ્રી સ્વામિનારાયણના સ્વમુખે બોલાયેલા ૨૭૪ પરમ પવિત્ર વચનામૃત. પ્રશ્નોત્તરી, તિથિ અને દિવ્ય જ્ઞાન સાથે.",
      count: "274 Discourses",
      icon: BookOpen,
      accent: "var(--accent-primary)"
    },
    {
      id: "swaminivato",
      titleEn: "Swamini Vato",
      titleGu: "સ્વામીની વાતો",
      descEn: "3,825 practical spiritual discourses of Aksharbrahma Gunatitanand Swami, serving as the master key and commentary to the Vachanamrut.",
      descGu: "અક્ષરબ્રહ્મ ગુણાતીતાનંદ સ્વામીની ૩,૮૨૫ અમૃતવાણી અને ગીતા-ઉપનિષદના પાવન સંદર્ભ.",
      count: "3,825 Vato (16 Prakrans)",
      icon: ScrollText,
      accent: "#b45309"
    },
    {
      id: "ai",
      titleEn: "AI Spiritual Companion",
      titleGu: "AI આધ્યાત્મિક માર્ગદર્શક",
      descEn: "Ask any spiritual question in English or Gujarati. Powered by RAG with precise citations from both Vachanamrut and Swamini Vato.",
      descGu: "મનના નિયંત્રણ, વૈરાગ્ય, ભક્તિ કે સાધના સંબંધિત પ્રશ્નો પૂછો અને શાસ્ત્રોના આધાર સાથે ઉત્તર મેળવો.",
      count: "Conversational RAG",
      icon: Sparkles,
      accent: "#7c3aed"
    },
    {
      id: "shikshapatri",
      titleEn: "Shikshapatri",
      titleGu: "શિક્ષાપત્રી",
      descEn: "212 divine shlokas presenting the essence of all dharma and spiritual ethics for daily living.",
      descGu: "ભગવાન શ્રી સ્વામિનારાયણ રચિત સર્વ જીવોના કલ્યાણ માટે ૨૧૨ પવિત્ર શ્લોકોની આચારસંહિતા.",
      count: "212 Shlokas",
      icon: HeartHandshake,
      accent: "#059669"
    }
  ];

  const featuredTopics = [
    { nameEn: "Sarvopari Bhagavan", nameGu: "સર્વોપરી ભગવાન", id: 1 },
    { nameEn: "Sadhuno Mahima", nameGu: "સાધુનો મહિમા", id: 2 },
    { nameEn: "Swarupma Nishchay", nameGu: "સ્વરૂપમાં નિશ્ચય", id: 3 },
    { nameEn: "Man Vash Karvu", nameGu: "મન વશ કરવું", id: 4 },
    { nameEn: "Vairagya & Tyag", nameGu: "વૈરાગ્ય અને ત્યાગ", id: 5 },
    { nameEn: "Pativrata Bhakti", nameGu: "પતિવ્રતા ભક્તિ", id: 6 },
    { nameEn: "Aagna & Upasana", nameGu: "આજ્ઞા અને ઉપાસના", id: 7 }
  ];

  return (
    <div style={{ ...styles.container, padding: isMobile ? "20px 14px 80px 14px" : "32px 24px 60px 24px" }}>
      {/* Hero Banner */}
      <div style={{ ...styles.hero, padding: isMobile ? "28px 20px" : "48px 40px" }}>
        <div style={styles.heroContent}>
          <div style={styles.greetingBadge}>
            <Sun size={14} color="var(--accent-primary)" />
            <span>{lang === "gu" ? "નિદિધ્યા • Nididhya" : "Welcome to Nididhya"}</span>
          </div>

          <h1 style={{ ...styles.heroTitle, fontSize: isMobile ? "22px" : "32px" }}>
            {lang === "gu"
              ? "અક્ષરપુરુષોત્તમ ઉપાસના અને પરમ તત્ત્વજ્ઞાન"
              : "Discover Sacred Truths with Intelligent Understanding"}
          </h1>

          <p style={{ ...styles.heroText, fontSize: isMobile ? "14px" : "16px" }}>
            {lang === "gu"
              ? "વચનામૃત, સ્વામીની વાતો અને શિક્ષાપત્રીનો અખૂટ ભંડાર. હવે આધુનિક AI સાથે સંવાદ કરો અને શાસ્ત્રોનું સત્ય શોધો."
              : "Discover the timeless spiritual truths of the Vachanamrut and Swamini Vato. Read scripture side-by-side with an intelligent AI spiritual assistant."}
          </p>

          <div style={{ ...styles.heroActions, flexDirection: isMobile ? "column" : "row" }}>
            <button
              onClick={() => onNavigate("ai")}
              style={{ ...styles.btnPrimary, justifyContent: "center" }}
            >
              <Sparkles size={16} />
              <span>{lang === "gu" ? "AI સાથે પ્રશ્ન પૂછો" : "Ask AI Assistant"}</span>
            </button>
            <button
              onClick={() => onNavigate("vachanamrut")}
              style={{ ...styles.btnSecondary, justifyContent: "center" }}
            >
              <BookOpen size={16} />
              <span>{lang === "gu" ? "વચનામૃત વાંચો" : "Browse Vachanamrut"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scripture Quick Access Grid */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? "18px" : "22px" }}>
            {lang === "gu" ? "પવિત્ર શાસ્ત્રો" : "Sacred Scriptures"}
          </h2>
          <span style={styles.sectionSubtitle}>
            {lang === "gu" ? "વાંચવા માટે શાસ્ત્ર પસંદ કરો" : "Select a scripture to explore and study"}
          </span>
        </div>

        <div style={styles.cardsGrid}>
          {scriptureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                style={styles.card}
                onClick={() => onNavigate(card.id)}
              >
                <div style={styles.cardTop}>
                  <div style={{ ...styles.cardIconBox, backgroundColor: card.accent }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <span style={styles.cardCount}>{card.count}</span>
                </div>
                <h3 style={styles.cardTitle}>
                  {lang === "gu" ? card.titleGu : card.titleEn}
                </h3>
                <p style={styles.cardDesc}>
                  {lang === "gu" ? card.descGu : card.descEn}
                </p>
                <div style={styles.cardFooter}>
                  <span style={styles.cardActionText}>
                    {lang === "gu" ? "ખોલો" : "Explore"}
                  </span>
                  <ArrowRight size={14} color="var(--accent-primary)" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Topics Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Flame size={17} color="var(--accent-primary)" />
            <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? "18px" : "22px" }}>
              {lang === "gu" ? "મુખ્ય વિષયો (વિષયવાર)" : "Spiritual Topics"}
            </h2>
          </div>
          <button onClick={() => onNavigate("topics")} style={styles.viewAllBtn}>
            {lang === "gu" ? "બધા ૩૩ વિષયો →" : "View all 33 →"}
          </button>
        </div>

        <div style={styles.topicsGrid}>
          {featuredTopics.map((topic) => (
            <div
              key={topic.id}
              style={styles.topicChip}
              onClick={() => onNavigate("topics")}
            >
              <Flame size={13} color="var(--accent-gold)" />
              <span>{lang === "gu" ? topic.nameGu : topic.nameEn}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    overflowY: "auto",
    height: "calc(100vh - 60px)"
  },
  hero: {
    background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-muted) 100%)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-sm)",
    position: "relative",
    overflow: "hidden"
  },
  heroContent: {
    maxWidth: "700px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  greetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--accent-light)",
    color: "var(--accent-primary)",
    fontWeight: "600",
    fontSize: "12px",
    width: "fit-content"
  },
  heroTitle: {
    fontWeight: "800",
    color: "var(--text-primary)",
    lineHeight: "1.25",
    letterSpacing: "-0.02em"
  },
  heroText: {
    color: "var(--text-secondary)",
    lineHeight: "1.6"
  },
  heroActions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px"
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--accent-primary)",
    color: "#fff",
    padding: "11px 20px",
    borderRadius: "var(--radius-md)",
    fontWeight: "600",
    fontSize: "13px",
    boxShadow: "var(--shadow-sm)"
  },
  btnSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    padding: "11px 20px",
    borderRadius: "var(--radius-md)",
    fontWeight: "600",
    fontSize: "13px"
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  sectionTitle: {
    fontWeight: "700",
    color: "var(--text-primary)"
  },
  sectionSubtitle: {
    fontSize: "13px",
    color: "var(--text-muted)"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px"
  },
  card: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "var(--shadow-sm)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardCount: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-muted)",
    backgroundColor: "var(--bg-muted)",
    padding: "3px 8px",
    borderRadius: "var(--radius-full)"
  },
  cardTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "var(--text-primary)"
  },
  cardDesc: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    flex: 1
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "6px",
    fontWeight: "600",
    fontSize: "12px",
    color: "var(--accent-primary)"
  },
  cardActionText: {
    color: "var(--accent-primary)"
  },
  topicsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  topicChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "7px 14px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    fontWeight: "500",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)"
  },
  viewAllBtn: {
    color: "var(--accent-primary)",
    fontWeight: "600",
    fontSize: "12px"
  }
};
