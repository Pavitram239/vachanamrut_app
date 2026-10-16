import React, { useState, useEffect } from "react";
import { Search, BookOpen, Calendar, Clock, ChevronRight, Loader2, ArrowLeft, ChevronDown, Filter } from "lucide-react";
import apiClient from "../utils/CustomFetch";
import { useResponsive } from "../utils/useResponsive";

export default function VachanamrutView({ lang, initialCitation }) {
  const { isMobile } = useResponsive();
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [activeItem, setActiveItem] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [localLang, setLocalLang] = useState(lang || "gu");
  // On mobile, control whether user is reading or viewing list
  const [mobileViewingReader, setMobileViewingReader] = useState(false);

  useEffect(() => {
    if (lang) setLocalLang(lang);
  }, [lang]);

  useEffect(() => {
    const fetchList = async () => {
      setLoadingList(true);
      try {
        const res = await apiClient.get("/api/vachanamrut/list");
        setList(res.data);
        if (res.data && res.data.length > 0) {
          if (initialCitation) {
            const match = res.data.find(
              (it) =>
                it.chapter?.toLowerCase() === initialCitation.chapter?.toLowerCase() &&
                String(it.vachanamrut_no) === String(initialCitation.vachanamrut_no)
            );
            setActiveItem(match || res.data[0]);
            if (isMobile) setMobileViewingReader(true);
          } else if (!isMobile) {
            setActiveItem(res.data[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching Vachanamrut list:", err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchList();
  }, [initialCitation, isMobile]);

  useEffect(() => {
    if (!activeItem) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get("/api/vachanamrut", {
          params: {
            chapter: activeItem.chapter,
            section: activeItem.section || "",
            number: activeItem.vachanamrut_no
          }
        });
        setActiveDetail(res.data);
      } catch (err) {
        console.error("Error fetching Vachanamrut text:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [activeItem]);

  const sections = [
    { id: "All", en: "All Sections (274 Discourses)", gu: "બધા પ્રકરણો (૨૭૪ વચનામૃત)" },
    { id: "Gadhada Pratham", en: "Gadhada I (Pratham) - 78", gu: "ગઢડા પ્રથમ - ૭૮" },
    { id: "Gadhada Madhya", en: "Gadhada II (Madhya) - 67", gu: "ગઢડા મધ્ય - ૬૭" },
    { id: "Gadhada Antya", en: "Gadhada III (Antya) - 39", gu: "ગઢડા અંત્ય - ૩૯" },
    { id: "Sarangpur", en: "Sarangpur - 18", gu: "સારંગપુર - ૧૮" },
    { id: "Kariyani", en: "Kariyani - 12", gu: "કારિયાણી - ૧૨" },
    { id: "Loya", en: "Loya - 18", gu: "લોયા - ૧૮" },
    { id: "Panchala", en: "Panchala - 7", gu: "પંચાળા - ૭" },
    { id: "Varatal", en: "Vartal - 20", gu: "વડતાલ - ૨૦" },
    { id: "Amdavad", en: "Amdavad - 8", gu: "અમદાવાદ - ૮" },
    { id: "khagol", en: "Khagol-Bhugol - 1", gu: "ખગોળ-ભૂગોળ - ૧" }
  ];

  const filteredList = list.filter((item) => {
    const fullName = `${item.chapter} ${item.section}`.trim().toLowerCase();
    const matchesSec =
      selectedSection === "All" ||
      fullName.includes(selectedSection.toLowerCase()) ||
      item.chapter?.toLowerCase() === selectedSection.toLowerCase();

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(item.vachanamrut_no).includes(q) ||
      (item.title_en && item.title_en.toLowerCase().includes(q)) ||
      (item.title_gu && item.title_gu.toLowerCase().includes(q)) ||
      (item.chapter && item.chapter.toLowerCase().includes(q));

    return matchesSec && matchesSearch;
  });

  const handleSelectItem = (item) => {
    setActiveItem(item);
    if (isMobile) {
      setMobileViewingReader(true);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left List Pane: shown if not mobile OR if on mobile and not currently reading */}
      {(!isMobile || !mobileViewingReader) && (
        <aside style={{ ...styles.sidebar, width: isMobile ? "100%" : "360px" }}>
          {/* Search Box */}
          <div style={styles.searchBox}>
            <Search size={16} color="var(--text-muted)" />
            <input
              style={styles.searchInput}
              placeholder={localLang === "gu" ? "વચનામૃત શોધો (નંબર અથવા નામ)..." : "Search discourse by name or number..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Section Filter Dropdown */}
          <div style={styles.dropdownContainer}>
            <div style={styles.dropdownHeader}>
              <Filter size={12} color="var(--accent-primary)" />
              <span style={styles.dropdownLabel}>
                {localLang === "gu" ? "પ્રકરણ પસંદ કરો" : "Select Section"}
              </span>
            </div>
            <div style={styles.selectWrapper}>
              <select
                style={styles.select}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {localLang === "gu" ? sec.gu : sec.en}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={styles.selectArrow} />
            </div>
          </div>

          {/* List of Vachanamruts */}
          <div style={styles.listContainer}>
            {loadingList ? (
              <div style={styles.centerBox}>
                <Loader2 size={24} className="spin" color="var(--accent-primary)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading list...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={styles.centerBox}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>No discourses found.</span>
              </div>
            ) : (
              filteredList.map((item) => {
                const active =
                  activeItem &&
                  activeItem.chapter === item.chapter &&
                  activeItem.section === item.section &&
                  activeItem.vachanamrut_no === item.vachanamrut_no;

                return (
                  <div
                    key={`${item.chapter}-${item.section}-${item.vachanamrut_no}`}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      ...styles.listItem,
                      ...(active && !isMobile ? styles.listItemActive : {})
                    }}
                  >
                    <div style={styles.listNoBadge}>{item.vachanamrut_no}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.listChapter}>
                        {item.chapter} {item.section}
                      </div>
                      <div style={styles.listTitle}>
                        {localLang === "gu" && item.title_gu ? item.title_gu : item.title_en}
                      </div>
                      {item.panchang_date && (
                        <div style={styles.listDate}>
                          <Calendar size={11} /> {item.panchang_date}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* Right Reading View: shown if not mobile OR if on mobile and currently viewing reader */}
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
              <span style={{ color: "var(--text-muted)" }}>Loading sacred scripture...</span>
            </div>
          ) : activeDetail ? (
            <article style={{ ...styles.article, padding: isMobile ? "20px 16px" : "40px" }}>
              <div style={styles.articleHeader}>
                <div style={styles.chapterTag}>
                  <BookOpen size={14} color="var(--accent-primary)" />
                  <span>
                    {activeDetail.chapter} {activeDetail.section} {activeDetail.vachanamrut_no}
                  </span>
                </div>

                <div style={styles.readerLangControl}>
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
                  <button
                    onClick={() => setLocalLang("hi")}
                    style={{ ...styles.langTab, ...(localLang === "hi" ? styles.langTabActive : {}) }}
                  >
                    हि
                  </button>
                </div>
              </div>

              <h1 style={{ ...styles.articleTitle, fontSize: isMobile ? "20px" : "26px" }}>
                {localLang === "gu" && activeDetail.title_gu
                  ? activeDetail.title_gu
                  : localLang === "hi" && activeDetail.title_hi
                  ? activeDetail.title_hi
                  : activeDetail.title_en}
              </h1>

              {(activeDetail.tithi || activeDetail.panchang_date) && (
                <div style={styles.panchangBar}>
                  {activeDetail.tithi && (
                    <span style={styles.panchangItem}>
                      <Clock size={12} color="var(--accent-gold)" />
                      {activeDetail.tithi}
                    </span>
                  )}
                  {activeDetail.panchang_date && (
                    <span style={styles.panchangItem}>
                      <Calendar size={12} color="var(--accent-gold)" />
                      {activeDetail.panchang_date}
                    </span>
                  )}
                </div>
              )}

              {activeDetail.dhyan_slok && (
                <div className="shlok-banner">
                  <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "var(--accent-primary)", marginBottom: "4px" }}>
                    ધ્યાન શ્લોક
                  </div>
                  <div style={{ fontSize: "14px", fontFamily: "var(--font-serif)" }}>
                    {activeDetail.dhyan_slok}
                  </div>
                </div>
              )}

              <div style={styles.textContent}>
                <div style={styles.paragraphs} className={localLang === "gu" ? "font-gujarati" : ""}>
                  {localLang === "gu" && activeDetail.text_gu
                    ? activeDetail.text_gu
                    : localLang === "hi" && activeDetail.text_hi
                    ? activeDetail.text_hi
                    : activeDetail.text_en || activeDetail.text_gu}
                </div>
              </div>
            </article>
          ) : (
            <div style={styles.centerBox}>
              <span style={{ color: "var(--text-muted)" }}>Select a discourse to begin reading.</span>
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
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface-elevated)"
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "13px",
    color: "var(--text-primary)"
  },
  dropdownContainer: {
    padding: "8px 14px 10px 14px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-app)",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  dropdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  dropdownLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  selectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  select: {
    width: "100%",
    padding: "7px 28px 7px 10px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: "12px",
    fontWeight: "600",
    appearance: "none",
    cursor: "pointer",
    outline: "none"
  },
  selectArrow: {
    position: "absolute",
    right: "10px",
    pointerEvents: "none",
    color: "var(--text-muted)"
  },
  listContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "8px"
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  listNoBadge: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "var(--bg-muted)",
    color: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0
  },
  listChapter: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--accent-gold)",
    textTransform: "uppercase"
  },
  listTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  listDate: {
    fontSize: "11px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px"
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
  chapterTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--accent-primary)",
    textTransform: "uppercase"
  },
  readerLangControl: {
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
    color: "var(--accent-primary)",
    boxShadow: "var(--shadow-sm)"
  },
  articleTitle: {
    fontWeight: "800",
    color: "var(--text-primary)",
    lineHeight: "1.3",
    marginBottom: "12px"
  },
  panchangBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    padding: "6px 10px",
    backgroundColor: "var(--bg-muted)",
    borderRadius: "var(--radius-sm)",
    marginBottom: "16px",
    fontSize: "11px",
    color: "var(--text-secondary)"
  },
  panchangItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  textContent: {
    marginTop: "20px"
  },
  paragraphs: {
    fontSize: "var(--reader-font-size)",
    lineHeight: "1.85",
    color: "var(--text-primary)",
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
