"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Settings, HelpCircle, Sparkles, BookOpen, Lightbulb, MessageCircle, RefreshCw } from "lucide-react";
import { Message, Chat, generateId, formatTime, AppSettings } from "@/lib/store";

interface ChatAreaProps {
  chat: Chat | null;
  settings: AppSettings;
  onUpdateChat: (chat: Chat) => void;
  onOpenSettings: () => void;
  view: "chat" | "archived" | "templates" | "drafts";
}

const WELCOME_CARDS = [
  { icon: <Sparkles size={16} />, title: "ถามคำถาม", desc: "ถามอะไรก็ได้ที่คุณต้องการทราบ" },
  { icon: <BookOpen size={16} />, title: "ค้นหาข้อมูล", desc: "ค้นหาจากฐานข้อมูลที่อัปโหลด" },
  { icon: <Lightbulb size={16} />, title: "ขอคำแนะนำ", desc: "รับคำแนะนำและแนวทางจาก AI" },
  { icon: <MessageCircle size={16} />, title: "สนทนาภาษาไทย", desc: "พูดคุยได้ทั้งภาษาไทยและอังกฤษ" },
];

const TEMPLATES = [
  { title: "สรุปเอกสาร", prompt: "กรุณาสรุปเอกสารต่อไปนี้ให้กระชับและเข้าใจง่าย:" },
  { title: "อธิบายแนวคิด", prompt: "กรุณาอธิบายแนวคิดเรื่อง [หัวข้อ] ให้เข้าใจง่าย:" },
  { title: "เปรียบเทียบ", prompt: "กรุณาเปรียบเทียบระหว่าง [A] และ [B] ในแง่มุมต่างๆ:" },
  { title: "แปลภาษา", prompt: "กรุณาแปลข้อความต่อไปนี้เป็นภาษาอังกฤษ:" },
  { title: "เขียน Email", prompt: "กรุณาช่วยเขียน email อาชีพเกี่ยวกับ:" },
  { title: "วิเคราะห์ข้อมูล", prompt: "กรุณาวิเคราะห์ข้อมูลต่อไปนี้และสรุปประเด็นสำคัญ:" },
];

export default function ChatArea({ chat, settings, onUpdateChat, onOpenSettings, view }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    if (!settings.openaiKey) {
      setError("กรุณาใส่ OpenAI API Key ในการตั้งค่าก่อน");
      setTimeout(() => setError(""), 4000);
      return;
    }

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    const updatedMessages = [...(chat?.messages || []), userMsg];
    const updatedChat: Chat = {
      id: chat?.id || generateId(),
      title: chat?.title || messageText.slice(0, 40) + (messageText.length > 40 ? "..." : ""),
      messages: updatedMessages,
      createdAt: chat?.createdAt || new Date(),
    };
    onUpdateChat(updatedChat);
    setIsLoading(true);
    setError("");

    try {
      // Build knowledge base context if available
      let kbContext = "";
      if (settings.uploadedFiles.length > 0) {
        kbContext += `\n\nไฟล์ที่อัปโหลดในฐานข้อมูล: ${settings.uploadedFiles.map(f => f.name).join(", ")}`;
      }
      if (settings.googleDriveLink) {
        kbContext += `\n\nGoogle Drive: ${settings.googleDriveLink}`;
      }
      if (settings.websiteUrl) {
        kbContext += `\n\nWebsite URL: ${settings.websiteUrl}`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: settings.systemPrompt + kbContext,
          model: settings.model,
          apiKey: settings.openaiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      // Stream response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      const streamChat: Chat = {
        ...updatedChat,
        messages: [...updatedMessages, assistantMsg],
      };
      onUpdateChat(streamChat);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                assistantText += delta;
                onUpdateChat({
                  ...streamChat,
                  messages: [
                    ...updatedMessages,
                    { ...assistantMsg, content: assistantText },
                  ],
                });
              } catch {}
            }
          }
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [input, chat, settings, onUpdateChat, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ===== TEMPLATES VIEW =====
  if (view === "templates") {
    return (
      <div className="main-area">
        <div className="chat-header">
          <h2 className="chat-title">📄 แม่แบบ (Templates)</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={onOpenSettings}><Settings size={18} /></button>
          </div>
        </div>
        <div className="messages-area">
          <div style={{ maxWidth: 600 }}>
            <p style={{ fontFamily: "var(--font-thai)", fontSize: 15, color: "var(--text-secondary)", marginBottom: 20 }}>
              เลือกแม่แบบด้านล่างเพื่อเริ่มต้นการสนทนา
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  className="welcome-card"
                  onClick={() => { setInput(t.prompt); }}
                  style={{ textAlign: "left", display: "block" }}
                >
                  <div className="welcome-card-title">{t.title}</div>
                  <div className="welcome-card-desc">{t.prompt.slice(0, 50)}...</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ARCHIVED VIEW =====
  if (view === "archived") {
    return (
      <div className="main-area">
        <div className="chat-header">
          <h2 className="chat-title">📦 เก็บถาวร</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={onOpenSettings}><Settings size={18} /></button>
          </div>
        </div>
        <div className="messages-area">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <span style={{ fontSize: 48 }}>📦</span>
            <p style={{ fontFamily: "var(--font-thai)", fontSize: 15, color: "var(--text-muted)" }}>ยังไม่มีแชทที่เก็บถาวร</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== DRAFTS VIEW =====
  if (view === "drafts") {
    return (
      <div className="main-area">
        <div className="chat-header">
          <h2 className="chat-title">✏️ ร่าง (Drafts)</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={onOpenSettings}><Settings size={18} /></button>
          </div>
        </div>
        <div className="messages-area">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <span style={{ fontSize: 48 }}>✏️</span>
            <p style={{ fontFamily: "var(--font-thai)", fontSize: 15, color: "var(--text-muted)" }}>ยังไม่มีร่างที่บันทึกไว้</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN CHAT VIEW =====
  const messages = chat?.messages || [];
  const showWelcome = messages.length === 0;

  return (
    <div className="main-area">
      {/* Header */}
      <div className="chat-header">
        <h2 className="chat-title">
          {chat?.title || "CZS AI by INT"}
        </h2>
        <div className="header-actions">
          <button className="icon-btn" title="ความช่วยเหลือ">
            <HelpCircle size={18} />
          </button>
          <button className="icon-btn" onClick={onOpenSettings} title="การตั้งค่า">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {showWelcome ? (
          <div className="welcome-screen fade-in">
            <div className="welcome-logo">
              <span style={{ fontSize: 28 }}>🌿</span>
            </div>
            <h1 className="welcome-title">CZS AI by INT</h1>
            <p className="welcome-subtitle">
              ยินดีต้อนรับสู่ดินแดนแห่งความรู้<br />
              ถามสิ่งที่คุณต้องการทราบได้เลย
            </p>
            <div className="welcome-cards">
              {WELCOME_CARDS.map((card, i) => (
                <button
                  key={i}
                  className="welcome-card"
                  onClick={() => setInput(card.desc)}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                >
                  <div className="welcome-card-title">{card.icon}{card.title}</div>
                  <div className="welcome-card-desc">{card.desc}</div>
                </button>
              ))}
            </div>
            {!settings.openaiKey && (
              <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(160,72,48,0.1)", border: "1px solid var(--accent-rust)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--accent-rust)", fontSize: 13, fontFamily: "var(--font-thai)" }}>
                  ⚠️ กรุณาใส่ OpenAI API Key ใน
                </span>
                <button
                  onClick={onOpenSettings}
                  style={{ color: "var(--accent-terracotta)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 13, fontWeight: 600, textDecoration: "underline" }}
                >
                  การตั้งค่า
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role} fade-in`}>
              <div className={`message-avatar${msg.role === "user" ? " user-avatar-msg" : ""}`}>
                {msg.role === "user"
                  ? (settings.userName || "U").charAt(0).toUpperCase()
                  : "🌿"
                }
              </div>
              <div className="message-content">
                <div className="message-sender">
                  {msg.role === "user" ? settings.userName || "คุณ" : "CZS AI"}
                </div>
                <div className={`message-bubble ${msg.role}`}>
                  {msg.content || (
                    <div className="typing-indicator" style={{ background: "transparent", border: "none", padding: 0 }}>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                </div>
                <div className="message-timestamp">{formatTime(new Date(msg.timestamp))}</div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="message-row assistant fade-in">
            <div className="message-avatar">🌿</div>
            <div className="message-content">
              <div className="message-sender">CZS AI</div>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ alignSelf: "center", padding: "10px 16px", background: "rgba(160,72,48,0.1)", border: "1px solid var(--accent-rust)", borderRadius: 10, fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--accent-rust)", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-rust)", marginLeft: 4 }}>✕</button>
          </div>
        )}

        {/* Suggestion chips for last AI message */}
        {!showWelcome && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isLoading && (
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
            placeholder="พูดคุยกับ CZS AI ..."
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="input-actions">
            <button className="attach-btn" title="แนบไฟล์">
              <Paperclip size={18} />
            </button>
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              title="ส่ง (Enter)"
            >
              {isLoading
                ? <RefreshCw size={16} style={{ animation: "spin 0.7s linear infinite" }} />
                : <Send size={16} />
              }
            </button>
          </div>
        </div>
        <div className="status-bar">
          <span className="status-pill">
            <span className="status-dot" />
            Encrypted Workspace
          </span>
          <span className="status-pill">
            <span className="status-dot" style={{ background: settings.openaiKey ? "var(--accent-sage)" : "var(--accent-rust)" }} />
            AI {settings.openaiKey ? "Active" : "No API Key"}
          </span>
        </div>
      </div>
    </div>
  );
}
