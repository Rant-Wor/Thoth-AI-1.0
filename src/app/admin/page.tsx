"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Lock, Save, Edit3, Database, Upload,
  Trash2, Check, Eye, EyeOff, Plus, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { DATABASES, DatabaseConfig, ADMIN_PASSWORD } from "@/lib/databases";

const STORAGE_KEY_ADMIN_DBS = "czs-ai-admin-databases";

interface AdminDatabase extends DatabaseConfig {
  customSystemPrompt?: string;
  notes?: string;
  isExpanded?: boolean;
}

function loadAdminDatabases(): AdminDatabase[] {
  if (typeof window === "undefined") return DATABASES as AdminDatabase[];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_DBS);
    if (!raw) return DATABASES.map((d) => ({ ...d }));
    const saved = JSON.parse(raw) as Partial<AdminDatabase>[];
    return DATABASES.map((d) => {
      const found = saved.find((s) => s.id === d.id);
      return { ...d, ...found };
    });
  } catch { return DATABASES.map((d) => ({ ...d })); }
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [databases, setDatabases] = useState<AdminDatabase[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check dark mode from settings
    try {
      const raw = localStorage.getItem("czs-ai-settings");
      if (raw) { const s = JSON.parse(raw); setDarkMode(s.darkMode || false); }
    } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme",
      (() => {
        try {
          const raw = localStorage.getItem("czs-ai-settings");
          if (raw) return JSON.parse(raw).darkMode ? "dark" : "light";
        } catch { /* ignore */ }
        return "light";
      })()
    );
    setMounted(true);
  }, []);

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
      setDatabases(loadAdminDatabases());
    } else {
      setPwError("รหัสผ่านไม่ถูกต้อง");
      setTimeout(() => setPwError(""), 3000);
    }
  };

  const handleSave = useCallback(() => {
    const toSave = databases.map(({ id, customSystemPrompt, notes }) => ({
      id, customSystemPrompt, notes,
    }));
    localStorage.setItem(STORAGE_KEY_ADMIN_DBS, JSON.stringify(toSave));
    setSaveMsg("บันทึกสำเร็จ!");
    setTimeout(() => setSaveMsg(""), 2500);
  }, [databases]);

  const updateDB = (id: string, field: keyof AdminDatabase, value: string | boolean) => {
    setDatabases((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };

  const toggleExpand = (id: string) => {
    setDatabases((prev) => prev.map((d) => d.id === id ? { ...d, isExpanded: !d.isExpanded } : d));
  };

  if (!mounted) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="spinner" />
      </div>
    );
  }

  /* ===== LOGIN SCREEN ===== */
  if (!authed) {
    return (
      <div className="page-admin" style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #6C7038, #484E20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}>
            🛡️
          </div>
          <h1 style={{ fontFamily: "var(--font-english)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Staff Admin
          </h1>
          <p style={{ fontFamily: "var(--font-thai)", fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
            เฉพาะเจ้าหน้าที่เท่านั้น · Authorized Staff Only
          </p>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={showPw ? "text" : "password"}
              className="text-input"
              placeholder="รหัสผ่าน Staff"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ paddingRight: 44 }}
              autoFocus
            />
            <button
              onClick={() => setShowPw((p) => !p)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {pwError && (
            <p style={{ fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--accent-rust)", marginBottom: 8 }}>
              ⚠️ {pwError}
            </p>
          )}

          <button className="btn-save" onClick={handleLogin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Lock size={16} /> เข้าสู่ระบบ Admin
          </button>

          <button
            onClick={() => router.push("/")}
            style={{ marginTop: 16, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}
          >
            <ArrowLeft size={14} /> กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  /* ===== ADMIN DASHBOARD ===== */
  return (
    <div className="page-admin" style={{ minHeight: "100vh", background: "var(--bg-main)" }}>

      {/* Top Bar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontFamily: "var(--font-thai)", fontSize: 13 }}
          >
            <ArrowLeft size={16} /> กลับ
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border-light)" }} />
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <div style={{ fontFamily: "var(--font-english)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Staff Admin Panel
            </div>
            <div style={{ fontFamily: "var(--font-thai)", fontSize: 11, color: "var(--text-muted)" }}>
              Thoth AI by INT · จัดการฐานข้อมูลและ AI Prompt
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(74,120,64,0.15)", borderRadius: 8, fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--accent-sage)" }}>
              <Check size={14} /> {saveMsg}
            </span>
          )}
          <button className="btn-save" onClick={handleSave} style={{ width: "auto", padding: "8px 20px", display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={16} /> บันทึกทั้งหมด
          </button>
          <button
            onClick={() => setAuthed(false)}
            style={{ padding: "8px 14px", background: "none", border: "1.5px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--text-secondary)" }}
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "ฐานข้อมูลทั้งหมด", value: databases.length, icon: "🗄️" },
            { label: "กำหนด Prompt เอง", value: databases.filter((d) => d.customSystemPrompt).length, icon: "✏️" },
            { label: "พร้อมใช้งาน", value: databases.length, icon: "✅" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-english)", fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</div>
                <div style={{ fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-english)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={18} style={{ color: "var(--page-accent)" }} />
            จัดการฐานข้อมูล
          </h2>
          <span style={{ fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)" }}>
            {databases.length} databases
          </span>
        </div>

        {/* Database cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {databases.map((db) => (
            <div
              key={db.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer" }}
                onClick={() => toggleExpand(db.id)}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: db.bgGradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>{db.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-english)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{db.nameTh}</div>
                  <div style={{ fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)" }}>
                    {db.customSystemPrompt ? "✏️ ใช้ Custom Prompt" : "📌 ใช้ Default Prompt"} · /chat/{db.slug}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/chat/${db.slug}`); }}
                  style={{ padding: "6px 12px", background: db.accentColor + "20", border: `1px solid ${db.accentColor}40`, borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 12, color: db.accentColor, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Eye size={12} /> ดูตัวอย่าง
                </button>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                  {db.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Expanded editor */}
              {db.isExpanded && (
                <div style={{ borderTop: "1px solid var(--border-light)", padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* System Prompt Editor */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{ fontFamily: "var(--font-thai)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Edit3 size={14} style={{ color: "var(--text-muted)" }} /> System Prompt
                      </label>
                      {db.customSystemPrompt && (
                        <button
                          onClick={() => updateDB(db.id, "customSystemPrompt", "")}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-rust)", fontFamily: "var(--font-thai)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <X size={12} /> รีเซ็ตเป็น Default
                        </button>
                      )}
                    </div>
                    <textarea
                      className="text-input"
                      rows={6}
                      style={{ resize: "vertical", fontFamily: "var(--font-thai)", fontSize: 13 }}
                      placeholder={db.systemPrompt}
                      value={db.customSystemPrompt || ""}
                      onChange={(e) => updateDB(db.id, "customSystemPrompt", e.target.value)}
                    />
                    <p style={{ fontFamily: "var(--font-thai)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      ถ้าว่างไว้จะใช้ Default Prompt · ถ้าใส่จะ override Default
                    </p>
                  </div>

                  {/* Example questions editor */}
                  <div>
                    <label style={{ fontFamily: "var(--font-thai)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Plus size={14} style={{ color: "var(--text-muted)" }} /> ตัวอย่างคำถาม
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {db.exampleQuestions.map((q, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)", width: 20, textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                          <input
                            type="text"
                            className="text-input"
                            style={{ flex: 1, padding: "7px 12px", fontSize: 13 }}
                            value={q}
                            onChange={(e) => {
                              const updated = [...db.exampleQuestions];
                              updated[i] = e.target.value;
                              setDatabases((prev) => prev.map((d) => d.id === db.id ? { ...d, exampleQuestions: updated } : d));
                            }}
                          />
                          <button
                            onClick={() => {
                              const updated = db.exampleQuestions.filter((_, idx) => idx !== i);
                              setDatabases((prev) => prev.map((d) => d.id === db.id ? { ...d, exampleQuestions: updated } : d));
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setDatabases((prev) => prev.map((d) => d.id === db.id ? { ...d, exampleQuestions: [...d.exampleQuestions, ""] } : d));
                        }}
                        style={{ alignSelf: "flex-start", padding: "6px 14px", background: "none", border: "1.5px dashed var(--border-medium)", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <Plus size={12} /> เพิ่มคำถาม
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ fontFamily: "var(--font-thai)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Upload size={14} style={{ color: "var(--text-muted)" }} /> หมายเหตุ / Notes (Staff เท่านั้น)
                    </label>
                    <textarea
                      className="text-input"
                      rows={2}
                      style={{ resize: "vertical", fontFamily: "var(--font-thai)", fontSize: 13 }}
                      placeholder="บันทึกข้อมูลสำหรับ staff..."
                      value={db.notes || ""}
                      onChange={(e) => updateDB(db.id, "notes", e.target.value)}
                    />
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save footer */}
        <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
          {saveMsg && (
            <span style={{ fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--accent-sage)", display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> {saveMsg}
            </span>
          )}
          <button className="btn-save" onClick={handleSave} style={{ width: "auto", padding: "10px 28px", display: "flex", alignItems: "center", gap: 8 }}>
            <Save size={16} /> บันทึกการเปลี่ยนแปลง
          </button>
        </div>

      </main>
    </div>
  );
}
