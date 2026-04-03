"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Shield, ChevronRight, Sparkles } from "lucide-react";
import { DATABASES, DatabaseConfig } from "@/lib/databases";
import SettingsModal from "@/components/SettingsModal";
import { AppSettings, DEFAULT_SETTINGS } from "@/lib/store";

const STORAGE_KEY_SETTINGS = "czs-ai-settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export default function LandingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    document.documentElement.setAttribute("data-theme", s.darkMode ? "dark" : "light");
    setMounted(true);
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    document.documentElement.setAttribute("data-theme", newSettings.darkMode ? "dark" : "light");
    setShowSettings(false);
  };

  const handleSelectDB = (db: DatabaseConfig) => {
    router.push(`/chat/${db.slug}`);
  };

  if (!mounted) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      className="page-landing"
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Bar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-light)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>☾✧</span>
          <div>
            <div style={{ fontFamily: "var(--font-english)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Thoth AI
            </div>
            <div style={{ fontFamily: "var(--font-thai)", fontSize: 11, color: "var(--text-muted)" }}>
              by INT · ระบบถาม-ตอบอัจฉริยะ
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="icon-btn"
            onClick={() => router.push("/admin")}
            title="Admin"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", width: "auto", borderRadius: 8, fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--text-secondary)" }}
          >
            <Shield size={16} />
            Staff Admin
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="ตั้งค่า"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "56px 24px 40px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 80, height: 80, borderRadius: 24,
          background: "linear-gradient(135deg, #C47850, #7A9470)",
          marginBottom: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          fontSize: 36,
        }}>
          ☾✧
        </div>
        <h1 style={{
          fontFamily: "var(--font-english)", fontSize: 38, fontWeight: 700,
          color: "var(--text-primary)", marginBottom: 10, letterSpacing: -1,
        }}>
          Thoth AI by INT
        </h1>
        <p style={{
          fontFamily: "var(--font-thai)", fontSize: 17, color: "var(--text-secondary)",
          maxWidth: 480, margin: "0 auto 8px",
          lineHeight: 1.7,
        }}>
          เลือกฐานข้อมูลที่ต้องการ แล้วเริ่มสนทนากับ Thoth AI ได้เลย
        </p>
        <p style={{ fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--text-muted)" }}>
          Select a knowledge base to start your conversation
        </p>
      </div>

      {/* Database Cards Grid */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px 48px",
      }}>
        {/* Top row — 2 wide cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          maxWidth: 780,
          width: "100%",
          marginBottom: 16,
        }}>
          {DATABASES.slice(0, 2).map((db) => (
            <DBCard
              key={db.id}
              db={db}
              hovered={hovered}
              onHover={setHovered}
              onClick={handleSelectDB}
            />
          ))}
        </div>

        {/* Middle row — 2 wide cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          maxWidth: 780,
          width: "100%",
          marginBottom: 16,
        }}>
          {DATABASES.slice(2, 4).map((db) => (
            <DBCard
              key={db.id}
              db={db}
              hovered={hovered}
              onHover={setHovered}
              onClick={handleSelectDB}
            />
          ))}
        </div>

        {/* Bottom row — Your AI centered full-width card */}
        <div style={{ maxWidth: 780, width: "100%" }}>
          <DBCard
            key={DATABASES[4].id}
            db={DATABASES[4]}
            hovered={hovered}
            onHover={setHovered}
            onClick={handleSelectDB}
            featured
          />
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontFamily: "var(--font-thai)", fontSize: 12, color: "var(--text-muted)" }}>
            ข้อมูลทั้งหมดเข้ารหัสและปลอดภัย · Powered by OpenAI GPT-4
          </span>
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

/* ===== DATABASE CARD COMPONENT ===== */
function DBCard({
  db,
  hovered,
  onHover,
  onClick,
  featured = false,
}: {
  db: DatabaseConfig;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onClick: (db: DatabaseConfig) => void;
  featured?: boolean;
}) {
  const isHov = hovered === db.id;

  return (
    <button
      onClick={() => onClick(db)}
      onMouseEnter={() => onHover(db.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: "flex",
        alignItems: featured ? "center" : "flex-start",
        gap: 16,
        padding: featured ? "20px 28px" : "20px 22px",
        background: isHov ? "var(--bg-hover)" : "var(--bg-card)",
        border: `1.5px solid ${isHov ? db.accentColor + "80" : "var(--border-light)"}`,
        borderRadius: 16,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.2s ease",
        transform: isHov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isHov ? `0 8px 24px ${db.accentColor}28` : "0 2px 8px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: db.bgGradient,
        opacity: isHov ? 1 : 0.5,
        transition: "opacity 0.2s",
      }} />

      {/* Icon bubble */}
      <div style={{
        width: featured ? 56 : 48,
        height: featured ? 56 : 48,
        borderRadius: 14,
        background: db.bgGradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: featured ? 26 : 22,
        flexShrink: 0,
        boxShadow: `0 4px 12px ${db.accentColor}40`,
      }}>
        {db.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-english)",
          fontSize: featured ? 18 : 16,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}>
          {db.nameTh}
        </div>
        <div style={{
          fontFamily: "var(--font-thai)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          marginBottom: featured ? 8 : 6,
        }}>
          {db.descriptionTh}
        </div>
        {/* Example chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {db.exampleQuestions.slice(0, featured ? 3 : 2).map((q, i) => (
            <span key={i} style={{
              padding: "3px 10px",
              borderRadius: 20,
              background: db.accentColor + "18",
              border: `1px solid ${db.accentColor}30`,
              fontFamily: "var(--font-thai)",
              fontSize: 11,
              color: db.accentColor,
              whiteSpace: "nowrap",
            }}>
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight
        size={20}
        style={{
          color: isHov ? db.accentColor : "var(--text-muted)",
          flexShrink: 0,
          transition: "color 0.2s, transform 0.2s",
          transform: isHov ? "translateX(3px)" : "translateX(0)",
        }}
      />
    </button>
  );
}
