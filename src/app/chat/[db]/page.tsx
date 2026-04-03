"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, HelpCircle, Plus, MessageSquare,
  Archive, FileText, Edit3, Send, Paperclip, RefreshCw, ChevronRight, Shield,
} from "lucide-react";
import { getDatabaseBySlug } from "@/lib/databases";
import { Chat, Message, AppSettings, DEFAULT_SETTINGS, generateId, formatTime } from "@/lib/store";
import SettingsModal from "@/components/SettingsModal";

const STORAGE_KEY_SETTINGS = "czs-ai-settings";
const STORAGE_KEY_CHATS_PREFIX = "czs-ai-chats-";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function loadChats(dbId: string): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHATS_PREFIX + dbId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Chat[];
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch { return []; }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const dbSlug = params.db as string;
  const db = getDatabaseBySlug(dbSlug);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sideView, setSideView] = useState<"chat" | "archived" | "templates" | "drafts">("chat");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    document.documentElement.setAttribute("data-theme", s.darkMode ? "dark" : "light");
    if (db) {
      const saved = loadChats(db.id);
      setChats(saved);
      if (saved.length > 0) setActiveChatId(saved[0].id);
    }
    setMounted(true);
  }, [db]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  const saveChats = useCallback((updated: Chat[]) => {
    if (!db) return;
    localStorage.setItem(STORAGE_KEY_CHATS_PREFIX + db.id, JSON.stringify(updated));
    setChats(updated);
  }, [db]);

  const handleNewChat = useCallback(() => {
    const newChat: Chat = {
      id: generateId(),
      title: "แชทใหม่",
      messages: [],
      createdAt: new Date(),
    };
    const updated = [newChat, ...chats];
    saveChats(updated);
    setActiveChatId(newChat.id);
    setSideView("chat");
  }, [chats, saveChats]);

  const handleUpdateChat = useCallback((updatedChat: Chat) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === updatedChat.id);
      const updated = existing
        ? prev.map((c) => (c.id === updatedChat.id ? updatedChat : c))
        : [updatedChat, ...prev];
      if (db) localStorage.setItem(STORAGE_KEY_CHATS_PREFIX + db.id, JSON.stringify(updated));
      return updated;
    });
    setActiveChatId(updatedChat.id);
  }, [db]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
  };

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading || !db) return;

    if (!settings.openaiKey) {
      setError("กรุณาใส่ OpenAI API Key ในการตั้งค่าก่อน");
      setTimeout(() => setError(""), 4000);
      return;
    }

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const activeChat = chats.find((c) => c.id === activeChatId);
    const userMsg: Message = { id: generateId(), role: "user", content: messageText, timestamp: new Date() };
    const updatedMessages = [...(activeChat?.messages || []), userMsg];
    const updatedChat: Chat = {
      id: activeChatId || generateId(),
      title: activeChat?.title === "แชทใหม่" || !activeChat
        ? messageText.slice(0, 40) + (messageText.length > 40 ? "..." : "")
        : activeChat.title,
      messages: updatedMessages,
      createdAt: activeChat?.createdAt || new Date(),
    };
    handleUpdateChat(updatedChat);
    setIsLoading(true);
    setError("");

    try {
      const systemPrompt = db.systemPrompt + (settings.uploadedFiles.length > 0
        ? `\n\nไฟล์ในฐานข้อมูล: ${settings.uploadedFiles.map((f) => f.name).join(", ")}`
        : "");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          model: settings.model,
          apiKey: settings.openaiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantMsg: Message = { id: generateId(), role: "assistant", content: "", timestamp: new Date() };

      handleUpdateChat({ ...updatedChat, messages: [...updatedMessages, assistantMsg] });

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              assistantText += parsed.choices?.[0]?.delta?.content || "";
              handleUpdateChat({
                ...updatedChat,
                messages: [...updatedMessages, { ...assistantMsg, content: assistantText }],
              });
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [input, chats, activeChatId, settings, db, isLoading, handleUpdateChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    document.documentElement.setAttribute("data-theme", newSettings.darkMode ? "dark" : "light");
    setShowSettings(false);
  };

  if (!db) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", gap: 16 }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <p style={{ fontFamily: "var(--font-thai)", fontSize: 18, color: "var(--text-primary)" }}>ไม่พบฐานข้อมูลนี้</p>
        <button className="btn-new-chat" style={{ width: "auto", padding: "10px 24px" }} onClick={() => router.push("/")}>กลับหน้าหลัก</button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="spinner" />
      </div>
    );
  }

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat?.messages || [];
  const showWelcome = messages.length === 0;

  return (
    <div className={`app-shell ${db.pageClass}`} data-theme={settings.darkMode ? "dark" : "light"}>

      {/* ===== SIDEBAR ===== */}
      <div className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <button
            onClick={() => router.push("/")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "0 0 8px", color: "var(--text-muted)", fontFamily: "var(--font-thai)", fontSize: 12 }}
          >
            <ArrowLeft size={14} /> กลับเลือกฐานข้อมูล
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: db.bgGradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>{db.icon}</div>
            <div>
              <div className="sidebar-title" style={{ fontSize: 16 }}>{db.nameTh}</div>
              <div className="sidebar-subtitle">Thoth AI · {db.name}</div>
            </div>
          </div>
        </div>

        {/* New Chat */}
        <button className="btn-new-chat" onClick={handleNewChat}>
          <Plus size={16} /> แชทใหม่
        </button>

        {/* Nav */}
        <div className="sidebar-nav">
          <button className={`nav-item${sideView === "chat" ? " active" : ""}`} onClick={() => setSideView("chat")}>
            <MessageSquare size={16} /> แชทล่าสุด
          </button>
          <button className={`nav-item${sideView === "archived" ? " active" : ""}`} onClick={() => setSideView("archived")}>
            <Archive size={16} /> เก็บถาวร
          </button>
          <button className={`nav-item${sideView === "templates" ? " active" : ""}`} onClick={() => setSideView("templates")}>
            <FileText size={16} /> แม่แบบ
          </button>
          <button className={`nav-item${sideView === "drafts" ? " active" : ""}`} onClick={() => setSideView("drafts")}>
            <Edit3 size={16} /> ร่าง
          </button>

          {/* History */}
          {chats.length > 0 && (
            <>
              <div className="sidebar-section-label">ประวัติแชท</div>
              {chats.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  className={`chat-history-item${activeChatId === c.id ? " active" : ""}`}
                  onClick={() => { setActiveChatId(c.id); setSideView("chat"); }}
                  title={c.title}
                >
                  <MessageSquare size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => router.push("/admin")}><Shield size={16} />Staff Admin<ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} /></button>
          <button className="nav-item" onClick={() => setShowSettings(true)}><Settings size={16} />การตั้งค่า<ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} /></button>
          <div className="user-info">
            <div className="user-avatar">{(settings.userName || "U").charAt(0).toUpperCase()}</div>
            <div>
              <div className="user-name">{settings.userName || "ผู้ใช้"}</div>
              <div className="user-role">Premium Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="main-area">
        {/* Header */}
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>☾✧</span>
            <div>
              <div className="chat-title">Thoth</div>
              <div style={{ fontFamily: "var(--font-thai)", fontSize: 11, color: "var(--text-muted)" }}>{db.nameTh}</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="ช่วยเหลือ"><HelpCircle size={18} /></button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="ตั้งค่า"><Settings size={18} /></button>
          </div>
        </div>

        {/* Messages / Views */}
        <div className="messages-area">
          {sideView === "archived" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}>
              <span style={{ fontSize: 48 }}>📦</span>
              <p style={{ fontFamily: "var(--font-thai)", color: "var(--text-muted)" }}>ยังไม่มีแชทที่เก็บถาวร</p>
            </div>
          )}
          {sideView === "drafts" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}>
              <span style={{ fontSize: 48 }}>✏️</span>
              <p style={{ fontFamily: "var(--font-thai)", color: "var(--text-muted)" }}>ยังไม่มีร่างที่บันทึกไว้</p>
            </div>
          )}
          {sideView === "templates" && (
            <div style={{ maxWidth: 600 }}>
              <p style={{ fontFamily: "var(--font-thai)", fontSize: 15, color: "var(--text-secondary)", marginBottom: 20 }}>
                ตัวอย่างคำถามสำหรับ {db.nameTh}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {db.exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="welcome-card"
                    onClick={() => { setInput(q); setSideView("chat"); }}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    <div className="welcome-card-title" style={{ fontSize: 14 }}>💬 {q}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sideView === "chat" && showWelcome && (
            <div className="welcome-screen fade-in">
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: db.bgGradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20, fontSize: 32,
                boxShadow: `0 8px 24px ${db.accentColor}40`,
              }}>
                {db.icon}
              </div>
              <h1 className="welcome-title">{db.nameTh}</h1>
              <p className="welcome-subtitle">{db.descriptionTh}<br />เริ่มถามคำถามได้เลย</p>
              <div className="welcome-cards">
                {db.exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="welcome-card"
                    onClick={() => sendMessage(q)}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    <div className="welcome-card-title" style={{ fontSize: 13 }}>💬 {q}</div>
                  </button>
                ))}
              </div>
              {!settings.openaiKey && (
                <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(160,72,48,0.1)", border: "1px solid var(--accent-rust)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--accent-rust)", fontSize: 13, fontFamily: "var(--font-thai)" }}>⚠️ กรุณาใส่ OpenAI API Key ใน</span>
                  <button onClick={() => setShowSettings(true)} style={{ color: "var(--accent-terracotta)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 13, fontWeight: 600, textDecoration: "underline" }}>การตั้งค่า</button>
                </div>
              )}
            </div>
          )}

          {sideView === "chat" && !showWelcome && messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role} fade-in`}>
              <div className={`message-avatar${msg.role === "user" ? " user-avatar-msg" : ""}`}>
                {msg.role === "user" ? (settings.userName || "U").charAt(0).toUpperCase() : "☾✧"}
              </div>
              <div className="message-content">
                <div className="message-sender">{msg.role === "user" ? settings.userName || "คุณ" : "Thoth"}</div>
                <div className={`message-bubble ${msg.role}`}>
                  {msg.content || (
                    <div style={{ display: "flex", gap: 4 }}>
                      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    </div>
                  )}
                </div>
                <div className="message-timestamp">{formatTime(new Date(msg.timestamp))}</div>
              </div>
            </div>
          ))}

          {sideView === "chat" && isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="message-row assistant fade-in">
              <div className="message-avatar">☾✧</div>
              <div className="message-content">
                <div className="message-sender">Thoth</div>
                <div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ alignSelf: "center", padding: "10px 16px", background: "rgba(160,72,48,0.1)", border: "1px solid var(--accent-rust)", borderRadius: 10, fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--accent-rust)", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {error}
              <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-rust)" }}>✕</button>
            </div>
          )}

          {sideView === "chat" && !showWelcome && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isLoading && (
            <div className="suggestion-chips" style={{ alignSelf: "flex-start", paddingLeft: 48 }}>
              <button className="chip" onClick={() => sendMessage("อธิบายเพิ่มเติม")}>อธิบายเพิ่มเติม</button>
              <button className="chip" onClick={() => sendMessage("ยกตัวอย่าง")}>ยกตัวอย่าง</button>
              <button className="chip" onClick={() => sendMessage("สรุปสั้นๆ")}>สรุปสั้นๆ</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="input-field"
              placeholder={`ถาม Thoth เกี่ยวกับ${db.nameTh}...`}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div className="input-actions">
              <button className="attach-btn" title="แนบไฟล์"><Paperclip size={18} /></button>
              <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || isLoading} title="ส่ง">
                {isLoading ? <RefreshCw size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : <Send size={16} />}
              </button>
            </div>
          </div>
          <div className="status-bar">
            <span className="status-pill"><span className="status-dot" />Encrypted Workspace</span>
            <span className="status-pill">
              <span className="status-dot" style={{ background: settings.openaiKey ? "var(--accent-sage)" : "var(--accent-rust)" }} />
              Thoth AI {settings.openaiKey ? "Active" : "No API Key"}
            </span>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
