import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, Book, User, Sparkles, Filter, RefreshCw } from "lucide-react";
import apiClient from "../utils/CustomFetch";

export default function ChatPanel({ onCitationClick, isPanelOpen, lang }) {
  const [input, setInput] = useState("");
  const [scope, setScope] = useState("All");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        lang === "gu"
          ? "જય સ્વામિનારાયણ! આપ વચનામૃત અને સ્વામીની વાતો વિશે કોઈપણ આધ્યાત્મિક પ્રશ્ન પૂછી શકો છો."
          : "Jay Swaminarayan! Ask any spiritual question from the Vachanamrut and Swamini Vato. I will provide answers grounded directly in sacred scripture."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    { en: "How can one control the mind?", gu: "મનને વશ કરવાનો ઉપાય શું છે?" },
    { en: "What are the characteristics of a true Sant?", gu: "સાચા સંતનાં લક્ષણ કેવાં હોય?" },
    { en: "Explain the three levels of Vairagya", gu: "ત્રણ પ્રકારના વૈરાગ્ય કયા છે?" },
    { en: "What is the nature of Maya?", gu: "માયાનું સ્વરૂપ શું છે?" }
  ];

  const sendMessage = async (overrideText) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = { role: "user", content: textToSend };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Create placeholder message for real-time streaming
    const botMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, role: "assistant", content: "", citations: [] }
    ]);
    setInput("");
    setLoading(true);

    try {
      const baseURL = "http://localhost:10000";
      const res = await fetch(`${baseURL}/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          history: historyPayload,
          chapter: scope === "Vachanamrut" ? "Gadhada" : "All",
          section: "All",
          vachanamrut_no: 0
        })
      });

      if (!res.ok) throw new Error("Stream request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType === "citations" && dataStr) {
            try {
              const citations = JSON.parse(dataStr);
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...m, citations } : m))
              );
            } catch (e) {
              console.error("Failed to parse citations", e);
            }
          } else if (eventType === "token" && dataStr) {
            try {
              const { token } = JSON.parse(dataStr);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: m.content + token } : m
                )
              );
            } catch (e) {
              console.error("Failed to parse token", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "gu"
              ? "ક્ષમા કરશો, શાસ્ત્ર સાથે જોડાણમાં ખામી આવી. કૃપા કરીને ફરી પ્રયાસ કરો."
              : "I encountered an error connecting to the scripture knowledge base. Please check backend connection."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          lang === "gu"
            ? "જય સ્વામિનારાયણ! નવી ચર્ચા માટે આપનો પ્રશ્ન પૂછો."
            : "Jay Swaminarayan! Ask a new question to begin."
      }
    ]);
  };

  return (
    <div style={{ ...styles.container, width: isPanelOpen ? "50%" : "100%" }}>
      {/* Chat Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={styles.botIconCircle}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h2 style={styles.headerTitle}>
              {lang === "gu" ? "AI આધ્યાત્મિક સંવાદ" : "AI Spiritual Companion"}
            </h2>
            <span style={styles.headerSubtitle}>
              {lang === "gu" ? "સંશોધિત શાસ્ત્રીય સંદર્ભ સાથે" : "Grounded in Vachanamrut & Swamini Vato"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={clearChat} style={styles.clearBtn} title="Clear Chat">
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div style={styles.scopeBar}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
          Scope:
        </span>
        {["All", "Vachanamrut", "Swamini Vato"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            style={{
              ...styles.scopeBtn,
              ...(scope === s ? styles.scopeBtnActive : {})
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={styles.messageList}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}
          >
            {msg.role === "assistant" && (
              <div style={styles.avatarBot}>
                <Bot size={16} color="#fff" />
              </div>
            )}

            <div
              style={{
                ...styles.bubble,
                backgroundColor:
                  msg.role === "user" ? "var(--accent-primary)" : "var(--bg-surface)",
                color: msg.role === "user" ? "#ffffff" : "var(--text-primary)",
                border:
                  msg.role === "assistant" ? "1px solid var(--border-color)" : "none"
              }}
            >
              <div style={styles.markdownBody}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Citations if available */}
              {msg.citations && msg.citations.length > 0 && (
                <div style={styles.citationBlock}>
                  <div style={styles.citationLabel}>
                    <Book size={12} color="var(--accent-gold)" />
                    <span>References & Sources:</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        style={styles.citeBtn}
                        onClick={() => onCitationClick && onCitationClick(cite.metadata)}
                      >
                        <Book size={11} />
                        <span>
                          {cite.metadata.scripture === "swamini_vato"
                            ? `Swamini Vato ${cite.metadata.prakran_no}.${cite.metadata.vat_no}`
                            : cite.metadata.scripture === "shikshapatri"
                            ? `Shikshapatri ${cite.metadata.shlok_no}`
                            : `${cite.metadata.chapter || ""} ${cite.metadata.section || ""} ${cite.metadata.vachanamrut_no || ""}`.trim()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div style={styles.avatarUser}>
                <User size={16} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={styles.thinkingRow}>
            <div style={styles.avatarBot}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={styles.thinkingBubble}>
              <Sparkles size={14} className="spin" color="var(--accent-primary)" />
              <span>Searching scriptures and synthesizing answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts (if chat is fresh) */}
      {messages.length <= 1 && (
        <div style={styles.promptsArea}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "8px" }}>
            {lang === "gu" ? "પ્રશ્ન પૂછવા માટે ઉદાહરણ:" : "Suggested Questions:"}
          </div>
          <div style={styles.promptsGrid}>
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                style={styles.promptChip}
                onClick={() => sendMessage(lang === "gu" ? p.gu : p.en)}
              >
                <span>{lang === "gu" ? p.gu : p.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder={
            lang === "gu"
              ? "આધ્યાત્મિક પ્રશ્ન પૂછો (દા.ત. મનને વશ કેવી રીતે કરવું?)..."
              : "Ask a spiritual question (e.g. How to overcome attachment?)..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={() => sendMessage()}
          style={{ ...styles.sendBtn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg-app)",
    transition: "width 0.3s ease"
  },
  header: {
    padding: "16px 24px",
    backgroundColor: "var(--bg-surface)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  botIconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0
  },
  headerSubtitle: {
    fontSize: "12px",
    color: "var(--text-muted)"
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 10px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-muted)",
    color: "var(--text-secondary)",
    fontSize: "12px",
    fontWeight: "600"
  },
  scopeBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 24px",
    backgroundColor: "var(--bg-surface-elevated)",
    borderBottom: "1px solid var(--border-color)"
  },
  scopeBtn: {
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-muted)"
  },
  scopeBtnActive: {
    backgroundColor: "var(--accent-primary)",
    color: "#fff",
    fontWeight: "600"
  },
  messageList: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  messageRow: {
    display: "flex",
    gap: "10px",
    maxWidth: "100%"
  },
  avatarBot: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarUser: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  bubble: {
    padding: "14px 18px",
    borderRadius: "var(--radius-lg)",
    maxWidth: "80%",
    boxShadow: "var(--shadow-sm)",
    lineHeight: "1.6"
  },
  markdownBody: {
    fontSize: "14px"
  },
  citationBlock: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid var(--border-color)"
  },
  citationLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent-gold)",
    marginBottom: "6px"
  },
  citeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "var(--bg-muted)",
    border: "1px solid var(--border-color)",
    color: "var(--accent-primary)",
    padding: "4px 9px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  },
  thinkingRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  thinkingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    color: "var(--text-muted)",
    fontSize: "13px"
  },
  promptsArea: {
    padding: "0 24px 16px 24px"
  },
  promptsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  promptChip: {
    padding: "8px 12px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left"
  },
  inputArea: {
    padding: "16px 24px",
    backgroundColor: "var(--bg-surface)",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-app)",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "14px"
  },
  sendBtn: {
    backgroundColor: "var(--accent-primary)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-md)",
    padding: "0 18px",
    cursor: "pointer"
  }
};
