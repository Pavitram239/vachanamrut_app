import React from "react";
import { BookOpen, Flame, Sparkles, Moon, Sun, Type, Compass, ScrollText } from "lucide-react";
import { useResponsive } from "../utils/useResponsive";

export default function Navbar({
  currentTab,
  setCurrentTab,
  theme,
  setTheme,
  lang,
  setLang,
  fontSize,
  setFontSize
}) {
  const { isMobile } = useResponsive();

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("app_theme", next);
  };

  const cycleFontSize = () => {
    const sizes = [14, 16, 18, 20];
    const idx = sizes.indexOf(fontSize);
    const next = sizes[(idx + 1) % sizes.length];
    setFontSize(next);
    document.documentElement.style.setProperty("--reader-font-size", `${next}px`);
  };

  const navItems = [
    { id: "home", labelEn: "Home", labelGu: "પ્રારંભ", icon: Compass },
    { id: "vachanamrut", labelEn: "Vachanamrut", labelGu: "વચનામૃત", icon: BookOpen },
    { id: "swaminivato", labelEn: "Swamini Vato", labelGu: "સ્વામીની વાતો", icon: ScrollText },
    { id: "ai", labelEn: "AI Guide", labelGu: "AI સહાયક", icon: Sparkles },
    { id: "topics", labelEn: "Topics", labelGu: "વિષયવાર", icon: Flame },
    { id: "shikshapatri", labelEn: "Shikshapatri", labelGu: "શિક્ષાપત્રી", icon: ScrollText }
  ];

  return (
    <>
      <header style={styles.header}>
        {/* Brand Title */}
        <div style={styles.brand} onClick={() => setCurrentTab("home")}>
          <div style={styles.logoBadge}>
            <Flame size={isMobile ? 16 : 20} color="#fff" />
          </div>
          <div>
            <div style={{ ...styles.brandTitle, fontSize: isMobile ? "15px" : "18px" }}>
              {lang === "gu" ? "નિદિધ્યા • Nididhya" : "Nididhya"}
            </div>
            {!isMobile && (
              <div style={styles.brandSubtitle}>
                {lang === "gu" ? "શાસ્ત્ર ચિંતન અને આધ્યાત્મિક સંવાદ" : "Sacred Scriptures & AI Companion"}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Desktop Only) */}
        {!isMobile && (
          <nav style={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    ...styles.navButton,
                    ...(active ? styles.navButtonActive : {})
                  }}
                >
                  <Icon size={15} />
                  <span>{lang === "gu" ? item.labelGu : item.labelEn}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Controls: Language, Font, Theme */}
        <div style={styles.controls}>
          <div style={styles.segmentedControl}>
            <button
              onClick={() => setLang("gu")}
              style={{ ...styles.segmentBtn, ...(lang === "gu" ? styles.segmentBtnActive : {}) }}
            >
              ગુ
            </button>
            <button
              onClick={() => setLang("en")}
              style={{ ...styles.segmentBtn, ...(lang === "en" ? styles.segmentBtnActive : {}) }}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              style={{ ...styles.segmentBtn, ...(lang === "hi" ? styles.segmentBtnActive : {}) }}
            >
              हि
            </button>
          </div>

          <button
            onClick={cycleFontSize}
            style={styles.iconBtn}
            title={`Font Size: ${fontSize}px`}
          >
            <Type size={16} />
            <span style={{ fontSize: "11px", fontWeight: "bold" }}>{fontSize}</span>
          </button>

          <button
            onClick={toggleTheme}
            style={styles.iconBtn}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Figma Mobile Flow) */}
      {isMobile && (
        <nav style={styles.bottomNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  ...styles.bottomNavBtn,
                  ...(active ? styles.bottomNavBtnActive : {})
                }}
              >
                <Icon size={18} color={active ? "var(--accent-primary)" : "var(--text-muted)"} />
                <span style={{ fontSize: "10px", marginTop: "2px" }}>
                  {lang === "gu" ? item.labelGu : item.labelEn}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}

const styles = {
  header: {
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    backgroundColor: "var(--bg-surface)",
    borderBottom: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-sm)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none"
  },
  logoBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(194, 65, 12, 0.3)"
  },
  brandTitle: {
    fontWeight: "700",
    color: "var(--text-primary)",
    letterSpacing: "-0.01em"
  },
  brandSubtitle: {
    fontSize: "11px",
    color: "var(--text-muted)"
  },
  nav: {
    display: "flex",
    gap: "4px",
    backgroundColor: "var(--bg-muted)",
    padding: "4px",
    borderRadius: "var(--radius-full)"
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    borderRadius: "var(--radius-full)",
    transition: "all 0.15s ease"
  },
  navButtonActive: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--accent-primary)",
    boxShadow: "var(--shadow-sm)",
    fontWeight: "600"
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  segmentedControl: {
    display: "flex",
    backgroundColor: "var(--bg-muted)",
    padding: "2px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)"
  },
  segmentBtn: {
    padding: "3px 7px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    borderRadius: "5px",
    transition: "all 0.15s ease"
  },
  segmentBtnActive: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--accent-primary)",
    boxShadow: "var(--shadow-sm)"
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px 8px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-secondary)"
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "58px",
    backgroundColor: "var(--bg-surface)",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
    paddingBottom: "env(safe-area-inset-bottom, 0px)"
  },
  bottomNavBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
    color: "var(--text-muted)"
  },
  bottomNavBtnActive: {
    color: "var(--accent-primary)",
    fontWeight: "700"
  }
};
