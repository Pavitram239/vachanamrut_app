import React, { useState, useEffect } from "react";
import { X, BookOpen, Clock, Calendar, Loader2, ArrowLeft } from "lucide-react";
import apiClient from "../utils/CustomFetch";
import { useResponsive } from "../utils/useResponsive";

export default function ReadingPanel({ citation, onClose, lang }) {
  const { isMobile } = useResponsive();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localLang, setLocalLang] = useState(lang || "gu");

  useEffect(() => {
    if (lang) setLocalLang(lang);
  }, [lang]);

  useEffect(() => {
    if (!citation) return;

    const fetchText = async () => {
      setLoading(true);
      setError(null);
      try {
        if (citation.scripture === "shikshapatri" || citation.shlok_no) {
          const res = await apiClient.get("/api/shikshapatri", {
            params: {
              shlok_no: citation.shlok_no
            }
          });
          setData(res.data);
        } else if (citation.prakran_no || citation.vat_no) {
          const res = await apiClient.get("/api/swaminivato", {
            params: {
              prakran_no: citation.prakran_no || 1,
              vat_no: citation.vat_no
            }
          });
          setData(res.data);
        } else {
          const { chapter, section, vachanamrut_no } = citation;
          const secParam = section || "";

          const res = await apiClient.get("/api/vachanamrut", {
            params: {
              chapter: chapter,
              section: secParam,
              number: vachanamrut_no
            }
          });
          setData(res.data);
        }
      } catch (err) {
        console.error("Error fetching citation text:", err);
        setError("Could not load scripture text.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [citation]);

  if (!citation) return null;

  return (
    <div
      style={{
        ...styles.panel,
        width: isMobile ? "100%" : "50%",
        top: isMobile ? 0 : "60px",
        height: isMobile ? "100vh" : "calc(100vh - 60px)",
        zIndex: isMobile ? 2000 : 50
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isMobile ? (
            <button onClick={onClose} style={styles.closeBtn}>
              <ArrowLeft size={18} />
            </button>
          ) : (
            <BookOpen size={18} color="var(--accent-primary)" />
          )}
          <h3 style={styles.headerTitle}>
            {citation.chapter || citation.prakran_name} {citation.section || ""} {citation.vachanamrut_no || citation.vat_no}
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={styles.langSegment}>
            <button
              onClick={() => setLocalLang("gu")}
              style={{ ...styles.langBtn, ...(localLang === "gu" ? styles.langBtnActive : {}) }}
            >
              ગુ
            </button>
            <button
              onClick={() => setLocalLang("en")}
              style={{ ...styles.langBtn, ...(localLang === "en" ? styles.langBtnActive : {}) }}
            >
              EN
            </button>
            <button
              onClick={() => setLocalLang("hi")}
              style={{ ...styles.langBtn, ...(localLang === "hi" ? styles.langBtnActive : {}) }}
            >
              हि
            </button>
          </div>

          {!isMobile && (
            <button onClick={onClose} style={styles.closeBtn} title="Close Reader">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.center}>
            <Loader2 size={28} className="spin" color="var(--accent-primary)" />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading scripture...</span>
          </div>
        )}

        {error && <div style={{ color: "red", padding: "20px" }}>{error}</div>}

        {data && !loading && (
          <article>
            <h2 style={{ ...styles.title, fontSize: isMobile ? "18px" : "22px" }}>
              {localLang === "gu" && data.title_gu
                ? data.title_gu
                : localLang === "hi" && data.title_hi
                ? data.title_hi
                : data.title_en}
            </h2>

            {(data.tithi || data.panchang_date) && (
              <div style={styles.panchangBar}>
                {data.tithi && (
                  <span style={styles.panchangItem}>
                    <Clock size={12} color="var(--accent-gold)" />
                    {data.tithi}
                  </span>
                )}
                {data.panchang_date && (
                  <span style={styles.panchangItem}>
                    <Calendar size={12} color="var(--accent-gold)" />
                    {data.panchang_date}
                  </span>
                )}
              </div>
            )}

            {data.dhyan_slok && (
              <div className="shlok-banner" style={{ fontSize: "13px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "3px" }}>
                  ધ્યાન શ્લોક
                </div>
                {data.dhyan_slok}
              </div>
            )}

            <div style={styles.textBlock}>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.9", fontSize: "var(--reader-font-size)" }}>
                {localLang === "gu"
                  ? data.text_gu
                  : localLang === "hi" && data.text_hi
                  ? data.text_hi
                  : data.text_en || data.text_gu}
              </p>
            </div>

            {data.sandarbh && (
              <div style={styles.sandarbhBox}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-gold)", marginBottom: "6px" }}>
                  સંદર્ભ (Sandarbh Commentary & References):
                </h4>
                <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {data.sandarbh}
                </p>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    borderLeft: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "var(--shadow-lg)",
    position: "absolute",
    right: 0
  },
  header: {
    padding: "12px 18px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--bg-surface-elevated)"
  },
  headerTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--text-primary)"
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)"
  },
  langSegment: {
    display: "flex",
    backgroundColor: "var(--bg-muted)",
    padding: "2px",
    borderRadius: "var(--radius-md)"
  },
  langBtn: {
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    borderRadius: "4px"
  },
  langBtnActive: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--accent-primary)"
  },
  content: {
    flex: 1,
    padding: "24px 20px",
    overflowY: "auto"
  },
  center: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    gap: "10px"
  },
  title: {
    marginTop: 0,
    fontWeight: "800",
    color: "var(--text-primary)",
    marginBottom: "12px",
    lineHeight: "1.3"
  },
  panchangBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "6px 10px",
    backgroundColor: "var(--bg-muted)",
    borderRadius: "var(--radius-sm)",
    marginBottom: "14px",
    fontSize: "11px",
    color: "var(--text-secondary)"
  },
  panchangItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  textBlock: {
    color: "var(--text-primary)",
    marginTop: "16px"
  },
  sandarbhBox: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-muted)",
    borderLeft: "3px solid var(--accent-gold)"
  }
};
