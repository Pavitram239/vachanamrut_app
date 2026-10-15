import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import VachanamrutView from "./components/VachanamrutView";
import SwaminiVatoView from "./components/SwaminiVatoView";
import TopicsView from "./components/TopicsView";
import ShikshapatriView from "./components/ShikshapatriView";
import ChatPanel from "./components/ChatPanel";
import ReadingPanel from "./components/ReadingPanel";

function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "en");
  const [fontSize, setFontSize] = useState(16);
  const [activeCitation, setActiveCitation] = useState(null);
  const [deepLinkVat, setDeepLinkVat] = useState(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Persist language selection
  useEffect(() => {
    localStorage.setItem("app_lang", lang);
  }, [lang]);

  const handleOpenVatFromTopics = (vatRef) => {
    setDeepLinkVat(vatRef);
    setCurrentTab("swaminivato");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Universal Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setActiveCitation(null);
          setCurrentTab(tab);
        }}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {currentTab === "home" && (
          <HomeView
            onNavigate={(tab) => {
              setActiveCitation(null);
              setCurrentTab(tab);
            }}
            lang={lang}
          />
        )}

        {currentTab === "vachanamrut" && (
          <VachanamrutView
            lang={lang}
            initialCitation={activeCitation}
          />
        )}

        {currentTab === "swaminivato" && (
          <SwaminiVatoView
            lang={lang}
            initialCitation={deepLinkVat || activeCitation}
          />
        )}

        {currentTab === "topics" && (
          <TopicsView
            lang={lang}
            onOpenVat={handleOpenVatFromTopics}
          />
        )}

        {currentTab === "shikshapatri" && (
          <ShikshapatriView
            lang={lang}
          />
        )}

        {currentTab === "ai" && (
          <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
            <ChatPanel
              onCitationClick={(citation) => setActiveCitation(citation)}
              isPanelOpen={!!activeCitation}
              lang={lang}
            />

            {activeCitation && (
              <ReadingPanel
                citation={activeCitation}
                onClose={() => setActiveCitation(null)}
                lang={lang}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
