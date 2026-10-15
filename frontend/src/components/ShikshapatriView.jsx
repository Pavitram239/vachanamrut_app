import React, { useState, useEffect } from "react";
import { ScrollText, Search, Loader2 } from "lucide-react";
import apiClient from "../utils/CustomFetch";

export default function ShikshapatriView({ lang }) {
  const [shlokas, setShlokas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [localLang, setLocalLang] = useState(lang === "hi" ? "hi" : "gu");

  useEffect(() => {
    if (lang === "hi") setLocalLang("hi");
    else setLocalLang("gu");
  }, [lang]);

  useEffect(() => {
    const fetchShlokas = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/api/shikshapatri");
        setShlokas(res.data);
      } catch (err) {
        console.error("Error loading Shikshapatri:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShlokas();
  }, []);

  const filtered = shlokas.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.shlok_no).includes(q) ||
      (item.shlok_sanskrit && item.shlok_sanskrit.toLowerCase().includes(q)) ||
      (item.bhashya_gu && item.bhashya_gu.toLowerCase().includes(q)) ||
      (item.bhashya_hi && item.bhashya_hi.toLowerCase().includes(q))
    );
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={styles.iconCircle}>
            <ScrollText size={20} color="#fff" />
          </div>
          <div>
            <h1 style={styles.title}>શ્રી શિક્ષાપત્રી (Shikshapatri)</h1>
            <p style={styles.subtitle}>
              ભગવાન શ્રી સ્વામિનારાયણ રચિત સર્વ જીવોના હિત માટે ૨૧૨ પવિત્ર શ્લોકો
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchBox}>
            <Search size={15} color="var(--text-muted)" />
            <input
              style={styles.searchInput}
              placeholder="શ્લોક નંબર અથવા શબ્દ શોધો..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={styles.langSegment}>
            <button
              onClick={() => setLocalLang("gu")}
              style={{ ...styles.langBtn, ...(localLang === "gu" ? styles.langBtnActive : {}) }}
            >
              ગુજરાતી ભાષ્ય
            </button>
            <button
              onClick={() => setLocalLang("hi")}
              style={{ ...styles.langBtn, ...(localLang === "hi" ? styles.langBtnActive : {}) }}
            >
              हिन्दी भाष्य
            </button>
          </div>
        </div>
      </div>

      {/* Shlokas List */}
      {loading ? (
        <div style={styles.centerBox}>
          <Loader2 size={32} className="spin" color="var(--accent-primary)" />
          <span style={{ color: "var(--text-muted)" }}>Loading Shikshapatri...</span>
        </div>
      ) : (
        <div style={styles.shlokList}>
          {filtered.map((item) => (
            <div key={item.shlok_no} style={styles.shlokCard}>
              <div style={styles.shlokCardHeader}>
                <span style={styles.shlokNumberBadge}>શ્લોક #{item.shlok_no}</span>
              </div>

              {/* Sanskrit Verse */}
              <div style={styles.sanskritVerse} className="font-serif">
                {item.shlok_sanskrit}
              </div>

              {/* Bhashya Commentary */}
              <div style={styles.bhashyaText} className="font-gujarati">
                {localLang === "hi" ? item.bhashya_hi || item.bhashya_gu : item.bhashya_gu}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "calc(100vh - 64px)",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "18px",
    flexWrap: "wrap",
    gap: "16px"
  },
  iconCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--text-primary)"
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-muted)"
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-surface)"
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "13px",
    color: "var(--text-primary)"
  },
  langSegment: {
    display: "flex",
    backgroundColor: "var(--bg-muted)",
    padding: "2px",
    borderRadius: "var(--radius-md)"
  },
  langBtn: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    borderRadius: "6px"
  },
  langBtnActive: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--accent-primary)",
    fontWeight: "700",
    boxShadow: "var(--shadow-sm)"
  },
  shlokList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "40px"
  },
  shlokCard: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    padding: "24px",
    boxShadow: "var(--shadow-sm)"
  },
  shlokCardHeader: {
    marginBottom: "10px"
  },
  shlokNumberBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent-primary)",
    backgroundColor: "var(--accent-light)",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)"
  },
  sanskritVerse: {
    fontSize: "17px",
    lineHeight: "1.7",
    color: "var(--text-primary)",
    marginBottom: "14px",
    fontWeight: "600",
    padding: "10px 14px",
    backgroundColor: "var(--bg-app)",
    borderRadius: "var(--radius-md)",
    borderLeft: "3px solid var(--accent-gold)"
  },
  bhashyaText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "var(--text-secondary)"
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    gap: "12px"
  }
};
