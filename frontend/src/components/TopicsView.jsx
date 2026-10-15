import React, { useState, useEffect } from "react";
import { Flame, ArrowRight, Loader2, BookOpen, ChevronRight } from "lucide-react";
import apiClient from "../utils/CustomFetch";
import { useResponsive } from "../utils/useResponsive";

export default function TopicsView({ lang, onOpenVat }) {
  const { isMobile } = useResponsive();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/api/topics");
        setTopics(res.data);
        if (res.data && res.data.length > 0) {
          setActiveTopic(res.data[0]);
        }
      } catch (err) {
        console.error("Error loading topics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px 14px 70px 14px" : "32px 24px" }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={styles.iconCircle}>
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? "20px" : "24px" }}>
              {lang === "gu" ? "વિષયવાર આધ્યાત્મિક સંચય" : "Thematic Explorer (Vishayvar)"}
            </h1>
            <p style={styles.subtitle}>
              {lang === "gu"
                ? "૩૩ મહત્વપૂર્ણ આધ્યાત્મિક વિષયો અને તેના સંબંધિત શાસ્ત્રીય ઉપદેશો"
                : "33 curated spiritual categories mapped directly to their relevant sacred discourses"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.centerBox}>
          <Loader2 size={32} className="spin" color="var(--accent-primary)" />
          <span style={{ color: "var(--text-muted)" }}>Loading topics...</span>
        </div>
      ) : (
        <div style={{ ...styles.contentGrid, flexDirection: isMobile ? "column" : "row" }}>
          {/* Topics List */}
          <div style={{ ...styles.topicsCol, width: isMobile ? "100%" : "360px", maxHeight: isMobile ? "240px" : "none" }}>
            <div style={styles.colHeader}>
              {lang === "gu" ? "વિષય સૂચિ" : "All Categories"} ({topics.length})
            </div>
            <div style={styles.topicsScroll}>
              {topics.map((t) => {
                const active = activeTopic && activeTopic.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTopic(t)}
                    style={{
                      ...styles.topicItem,
                      ...(active ? styles.topicItemActive : {})
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={styles.topicName}>
                        {lang === "gu" ? t.name_gu : t.name_en}
                      </div>
                      <div style={styles.topicSub}>
                        {lang === "gu" ? t.name_en : t.name_gu}
                      </div>
                    </div>
                    <span style={styles.countBadge}>
                      {t.linked_vat_ids?.length || 0} Vato
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discourses for Selected Topic */}
          <div style={{ ...styles.detailCol, padding: isMobile ? "20px 16px" : "32px" }}>
            {activeTopic ? (
              <div>
                <div style={styles.detailHeader}>
                  <div>
                    <span style={styles.detailPre}>Selected Theme</span>
                    <h2 style={{ ...styles.detailTitle, fontSize: isMobile ? "20px" : "26px" }}>
                      {lang === "gu" ? activeTopic.name_gu : activeTopic.name_en}
                    </h2>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {lang === "gu" ? activeTopic.name_en : activeTopic.name_gu}
                    </div>
                  </div>
                </div>

                <div style={styles.discourseList}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "10px" }}>
                    {lang === "gu" ? "આ વિષય સાથે જોડાયેલ વાતો:" : "Linked Discourses:"}
                  </div>
                  <div style={styles.vatGrid}>
                    {activeTopic.linked_vat_ids?.map((vatId) => (
                      <div
                        key={vatId}
                        style={styles.vatCard}
                        onClick={() => onOpenVat && onOpenVat({ vat_no: vatId, prakran_no: 1 })}
                      >
                        <div style={styles.vatCardNumber}>વાત #{vatId}</div>
                        <div style={styles.vatCardAction}>
                          <span>વાંચો</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.centerBox}>
                <span style={{ color: "var(--text-muted)" }}>Select a topic to explore discourses.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "calc(100vh - 60px)"
  },
  header: {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "14px"
  },
  iconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontWeight: "800",
    color: "var(--text-primary)"
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-muted)"
  },
  contentGrid: {
    display: "flex",
    gap: "18px",
    flex: 1,
    overflow: "hidden"
  },
  topicsCol: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flexShrink: 0
  },
  colHeader: {
    padding: "12px 16px",
    fontWeight: "700",
    fontSize: "13px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface-elevated)",
    color: "var(--text-secondary)"
  },
  topicsScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "6px"
  },
  topicItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    marginBottom: "3px",
    border: "1px solid transparent"
  },
  topicItemActive: {
    backgroundColor: "var(--accent-light)",
    borderColor: "var(--accent-primary)"
  },
  topicName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)"
  },
  topicSub: {
    fontSize: "11px",
    color: "var(--text-muted)"
  },
  countBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "var(--accent-gold)",
    backgroundColor: "var(--bg-muted)",
    padding: "2px 6px",
    borderRadius: "var(--radius-full)"
  },
  detailCol: {
    flex: 1,
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    overflowY: "auto"
  },
  detailHeader: {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "14px",
    marginBottom: "18px"
  },
  detailPre: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--accent-primary)"
  },
  detailTitle: {
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: "3px 0"
  },
  vatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "10px"
  },
  vatCard: {
    backgroundColor: "var(--bg-app)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  vatCardNumber: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-primary)"
  },
  vatCardAction: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--accent-primary)"
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "180px",
    gap: "10px"
  }
};
