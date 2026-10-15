import React, { useState, useEffect } from "react";
import { Search, ScrollText, ChevronRight, Loader2, BookOpen, ArrowLeft } from "lucide-react";
import apiClient from "../utils/CustomFetch";
import { useResponsive } from "../utils/useResponsive";

export default function SwaminiVatoView({ lang, initialCitation }) {
  const { isMobile } = useResponsive();
  const [selectedPrakran, setSelectedPrakran] = useState(1);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [activeVat, setActiveVat] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSandarbh, setShowSandarbh] = useState(true);
  const [localLang, setLocalLang] = useState(lang || "gu");
  const [mobileViewingReader, setMobileViewingReader] = useState(false);

  useEffect(() => {
    if (lang) setLocalLang(lang);
  }, [lang]);

  useEffect(() => {
    if (initialCitation && initialCitation.prakran_no) {
      setSelectedPrakran(Number(initialCitation.prakran_no));
      if (isMobile) setMobileViewingReader(true);
    }
  }, [initialCitation, isMobile]);

  useEffect(() => {
    const fetchList = async () => {
      setLoadingList(true);
      try {
        const res = await apiClient.get("/api/swaminivato/list", {
          params: { prakran_no: selectedPrakran }
        });
        setList(res.data);
        if (res.data && res.data.length > 0) {
          if (initialCitation && initialCitation.vat_no) {
            const match = res.data.find(
              (it) => String(it.vat_no) === String(initialCitation.vat_no)
            );
            setActiveVat(match || res.data[0]);
            if (isMobile) setMobileViewingReader(true);
          } else if (!isMobile) {
            setActiveVat(res.data[0]);
          }
        }
      } catch (err) {
        console.error("Error loading Swamini Vato list:", err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchList();
  }, [selectedPrakran, initialCitation, isMobile]);

  useEffect(() => {
    if (!activeVat) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get("/api/swaminivato", {
          params: {
            prakran_no: activeVat.prakran_no,
            vat_no: activeVat.vat_no
          }
        });
        setActiveDetail(res.data);
      } catch (err) {
        console.error("Error loading Vat details:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [activeVat]);

  const prakrans = Array.from({ length: 16 }, (_, i) => i + 1);

  const filteredList = list.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      String(item.vat_no).includes(q) ||
      (item.title_gu && item.title_gu.toLowerCase().includes(q)) ||
      (item.title_en && item.title_en.toLowerCase().includes(q))
    );
  });

  const handleSelectVat = (item) => {
    setActiveVat(item);
    if (isMobile) {
      setMobileViewingReader(true);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left List Pane: shown if not mobile OR if on mobile and not currently reading */}
      {(!isMobile || !mobileViewingReader) && (
        <aside style={{ ...styles.sidebar, width: isMobile ? "100%" : "360px" }}>
          {/* Prakran Selector */}
          <div style={styles.prakranHeader}>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
              પ્રકરણ પસંદ કરો / Select Prakaran
            </div>
            <div style={styles.prakranGrid}>
              {prakrans.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPrakran(p)}
                  style={{
                    ...styles.prakranBtn,
                    ...(selectedPrakran === p ? styles.prakranBtnActive : {})
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={styles.searchBox}>
            <Search size={15} color="var(--text-muted)" />
            <input
              style={styles.searchInput}
              placeholder="વાત નંબર અથવા શબ્દ શોધો..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Vato List */}
          <div style={styles.listContainer}>
            {loadingList ? (
              <div style={styles.centerBox}>
                <Loader2 size={24} className="spin" color="var(--accent-primary)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading Vato...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={styles.centerBox}>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No Vato found.</span>
              </div>
            ) : (
              filteredList.map((item) => {
                const active = activeVat && activeVat.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectVat(item)}
                    style={{
                      ...styles.listItem,
                      ...(active && !isMobile ? styles.listItemActive : {})
                    }}
                  >
                    <div style={styles.vatBadge}>{item.vat_no}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.vatTitle}>
                        {localLang === "gu" ? item.title_gu : item.title_en || item.title_gu}
                      </div>
                      {item.has_sandarbh && (
                        <span style={styles.sandarbhBadge}>સંદર્ભ ઉપલબ્ધ</span>
                      )}
                    </div>
                    <ChevronRight size={15} color="var(--text-muted)" />
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* Reader Area: shown if not mobile OR if on mobile and currently viewing reader */}
      {(!isMobile || mobileViewingReader) && (
        <main style={{ ...styles.readerArea, padding: isMobile ? "16px 12px 70px 12px" : "36px 48px" }}>
          {isMobile && (
            <button
              onClick={() => setMobileViewingReader(false)}
              style={styles.mobileBackBtn}
            >
              <ArrowLeft size={16} />
              <span>સૂચિ પર પાછા (Back to List)</span>
            </button>
          )}

          {loadingDetail ? (
            <div style={styles.centerBox}>
              <Loader2 size={32} className="spin" color="var(--accent-primary)" />
              <span style={{ color: "var(--text-muted)" }}>Loading Swamini Vat...</span>
            </div>
          ) : activeDetail ? (
            <article style={{ ...styles.article, padding: isMobile ? "20px 16px" : "40px" }}>
              <div style={styles.articleHeader}>
                <div style={styles.prakranTag}>
                  <ScrollText size={16} color="var(--accent-primary)" />
                  <span>
                    {activeDetail.prakran_name} • વાત {activeDetail.vat_no}
                  </span>
                </div>

                <div style={styles.langControl}>
                  <button
                    onClick={() => setLocalLang("gu")}
                    style={{ ...styles.langTab, ...(localLang === "gu" ? styles.langTabActive : {}) }}
                  >
                    ગુ
                  </button>
                  <button
                    onClick={() => setLocalLang("en")}
                    style={{ ...styles.langTab, ...(localLang === "en" ? styles.langTabActive : {}) }}
                  >
                    EN
                  </button>
                </div>
              </div>

              <h1 style={{ ...styles.articleTitle, fontSize: isMobile ? "20px" : "24px" }}>
                {localLang === "gu" ? activeDetail.title_gu : activeDetail.title_en || activeDetail.title_gu}
              </h1>

              <div style={styles.textContent}>
                {localLang === "en" && activeDetail.text_en ? (
                  <div style={styles.paragraphs}>
                    {activeDetail.text_en}
                  </div>
                ) : (
                  <div style={styles.paragraphs} className="font-gujarati">
                    {activeDetail.text_gu}
                  </div>
                )}
              </div>

              {activeDetail.sandarbh && (
                <section style={styles.sandarbhSection}>
                  <div
                    style={styles.sandarbhHeader}
                    onClick={() => setShowSandarbh(!showSandarbh)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BookOpen size={16} color="var(--accent-gold)" />
                      <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent-gold)", margin: 0 }}>
                        સંદર્ભ (Sandarbh Commentary & References)
                      </h3>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {showSandarbh ? "Hide ▲" : "Show ▼"}
                    </span>
                  </div>

                  {showSandarbh && (
                    <div style={styles.sandarbhBody} className="font-gujarati">
                      {activeDetail.sandarbh}
                    </div>
                  )}
                </section>
              )}
            </article>
          ) : (
            <div style={styles.centerBox}>
              <span style={{ color: "var(--text-muted)" }}>Select a Vat to read.</span>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "calc(100vh - 60px)",
    overflow: "hidden"
  },
  sidebar: {
    backgroundColor: "var(--bg-surface)",
    borderRight: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0
  },
  prakranHeader: {
    padding: "12px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface-elevated)"
  },
  prakranGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "4px"
  },
  prakranBtn: {
    padding: "6px 0",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-secondary)",
    textAlign: "center"
  },
  prakranBtnActive: {
    backgroundColor: "var(--accent-primary)",
    color: "#fff",
    borderColor: "var(--accent-primary)"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-app)"
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "13px",
    color: "var(--text-primary)"
  },
  listContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "8px"
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    marginBottom: "4px",
    border: "1px solid transparent"
  },
  listItemActive: {
    backgroundColor: "var(--accent-light)",
    borderColor: "var(--accent-primary)"
  },
  vatBadge: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    backgroundColor: "var(--bg-muted)",
    color: "var(--accent-gold)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0
  },
  vatTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  sandarbhBadge: {
    display: "inline-block",
    fontSize: "10px",
    color: "var(--accent-gold)",
    backgroundColor: "var(--bg-muted)",
    padding: "1px 6px",
    borderRadius: "var(--radius-full)",
    marginTop: "2px",
    fontWeight: "600"
  },
  readerArea: {
    flex: 1,
    overflowY: "auto",
    backgroundColor: "var(--bg-app)"
  },
  mobileBackBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "12px",
    cursor: "pointer"
  },
  article: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-sm)"
  },
  articleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px"
  },
  prakranTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--accent-primary)"
  },
  langControl: {
    display: "flex",
    backgroundColor: "var(--bg-muted)",
    padding: "2px",
    borderRadius: "var(--radius-md)"
  },
  langTab: {
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    borderRadius: "4px"
  },
  langTabActive: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--accent-primary)"
  },
  articleTitle: {
    fontWeight: "800",
    color: "var(--text-primary)",
    lineHeight: "1.3",
    marginBottom: "20px"
  },
  textContent: {
    fontSize: "var(--reader-font-size)",
    lineHeight: "1.9",
    color: "var(--text-primary)",
    marginBottom: "32px"
  },
  paragraphs: {
    whiteSpace: "pre-wrap"
  },
  sandarbhSection: {
    borderTop: "2px dashed var(--border-color)",
    paddingTop: "20px",
    marginTop: "20px"
  },
  sandarbhHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "10px 14px",
    backgroundColor: "var(--bg-muted)",
    borderRadius: "var(--radius-md)",
    marginBottom: "12px"
  },
  sandarbhBody: {
    padding: "16px",
    backgroundColor: "var(--bg-surface-elevated)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    fontSize: "14px",
    lineHeight: "1.8",
    color: "var(--text-secondary)",
    whiteSpace: "pre-wrap"
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px"
  }
};
