"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, Trash2, FileText, FileSpreadsheet, Link, Globe, Key, Bot, User, Moon, Sun, Check, AlertCircle } from "lucide-react";
import { AppSettings, UploadedFile, generateId, formatFileSize } from "@/lib/store";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState<AppSettings>({ ...settings });
  const [dragOver, setDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const allowed = ["application/pdf", "text/csv", "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/markdown", "text/plain", "application/octet-stream"];
      const newFiles: UploadedFile[] = [];

      Array.from(files).forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const isAllowed = allowed.includes(file.type) || ["pdf","csv","xlsx","xls","md","txt"].includes(ext || "");
        if (!isAllowed) {
          setUploadMsg(`ไฟล์ ${file.name} ไม่รองรับ`);
          setTimeout(() => setUploadMsg(""), 3000);
          return;
        }
        if (file.size > 50 * 1024 * 1024) {
          setUploadMsg(`ไฟล์ ${file.name} มีขนาดเกิน 50MB`);
          setTimeout(() => setUploadMsg(""), 3000);
          return;
        }
        newFiles.push({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type || ext || "unknown",
          uploadedAt: new Date(),
        });
      });

      if (newFiles.length > 0) {
        setLocal((prev) => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, ...newFiles],
        }));
        setUploadMsg(`อัปโหลด ${newFiles.length} ไฟล์สำเร็จ`);
        setTimeout(() => setUploadMsg(""), 3000);
      }
    },
    []
  );

  const removeFile = (id: string) => {
    setLocal((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id),
    }));
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText size={16} style={{ color: "var(--accent-rust)" }} />;
    if (["xlsx","xls","csv"].includes(ext || "")) return <FileSpreadsheet size={16} style={{ color: "var(--accent-sage)" }} />;
    return <FileText size={16} style={{ color: "var(--text-muted)" }} />;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">⚙️ การตั้งค่า</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">

          {/* ===== APPEARANCE ===== */}
          <div className="settings-section">
            <div className="settings-section-title">🎨 รูปแบบการแสดงผล</div>
            <div className="settings-row">
              <div>
                <div className="settings-label">โหมดมืด (Dark Mode)</div>
                <div className="settings-desc">เปลี่ยนธีมเป็นสีเข้มสำหรับการใช้งานในที่มืด</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={local.darkMode}
                  onChange={(e) => setLocal((p) => ({ ...p, darkMode: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* ===== AI MODEL ===== */}
          <div className="settings-section">
            <div className="settings-section-title">🤖 การตั้งค่า AI</div>

            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Key size={14} style={{ color: "var(--text-muted)" }} />
                  OpenAI API Key
                </span>
              </div>
              <input
                type="password"
                className="text-input"
                placeholder="sk-..."
                value={local.openaiKey}
                onChange={(e) => setLocal((p) => ({ ...p, openaiKey: e.target.value }))}
              />
              <div className="settings-desc" style={{ marginTop: 4 }}>
                {local.openaiKey
                  ? <span className="api-badge connected">✓ กำหนดค่าแล้ว</span>
                  : <span className="api-badge disconnected">ยังไม่ได้ใส่ API Key</span>
                }
              </div>
            </div>

            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Bot size={14} style={{ color: "var(--text-muted)" }} />
                  โมเดล AI
                </span>
              </div>
              <select
                className="select-input"
                value={local.model}
                onChange={(e) => setLocal((p) => ({ ...p, model: e.target.value }))}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              >
                <option value="gpt-4.1">GPT-4.1 (ใหม่ล่าสุด)</option>
                <option value="gpt-4.1-mini">GPT-4.1 Mini (เร็ว + ประหยัด) ⭐</option>
                <option value="gpt-4o">GPT-4o (แนะนำ)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>System Prompt</div>
              <textarea
                className="text-input"
                rows={3}
                value={local.systemPrompt}
                onChange={(e) => setLocal((p) => ({ ...p, systemPrompt: e.target.value }))}
                style={{ resize: "vertical" }}
                placeholder="ระบุบทบาทและพฤติกรรมของ AI..."
              />
            </div>
          </div>

          {/* ===== KNOWLEDGE BASE ===== */}
          <div className="settings-section">
            <div className="settings-section-title">📚 ฐานข้อมูลความรู้ (Knowledge Base)</div>

            {/* File Upload */}
            <div>
              <div className="settings-label" style={{ marginBottom: 8 }}>อัปโหลดไฟล์</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.xlsx,.xls,.md,.txt"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <div
                className={`upload-area${dragOver ? " drag-over" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <Upload size={28} style={{ color: "var(--text-muted)" }} />
                </div>
                <div className="upload-text">คลิกหรือลากไฟล์มาวางที่นี่</div>
                <div className="upload-subtext">รองรับ PDF, Excel, CSV, Markdown, TXT (สูงสุด 50MB)</div>
              </div>

              {uploadMsg && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: 6 }}>
                  {uploadMsg.includes("สำเร็จ")
                    ? <Check size={14} style={{ color: "var(--accent-sage)" }} />
                    : <AlertCircle size={14} style={{ color: "var(--accent-rust)" }} />
                  }
                  <span style={{ fontFamily: "var(--font-thai)", fontSize: 13, color: "var(--text-secondary)" }}>{uploadMsg}</span>
                </div>
              )}

              {local.uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  {local.uploadedFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      {getFileIcon(file.name)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatFileSize(file.size)}</div>
                      </div>
                      <button className="file-remove" onClick={() => removeFile(file.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Drive */}
            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Link size={14} style={{ color: "var(--text-muted)" }} />
                  Google Drive Link
                </span>
              </div>
              <input
                type="url"
                className="text-input"
                placeholder="https://drive.google.com/..."
                value={local.googleDriveLink}
                onChange={(e) => setLocal((p) => ({ ...p, googleDriveLink: e.target.value }))}
              />
              <div className="settings-desc" style={{ marginTop: 4 }}>วาง link ของ Google Drive folder หรือ Google Docs</div>
            </div>

            {/* Website URL */}
            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe size={14} style={{ color: "var(--text-muted)" }} />
                  Website / URL
                </span>
              </div>
              <input
                type="url"
                className="text-input"
                placeholder="https://example.com"
                value={local.websiteUrl}
                onChange={(e) => setLocal((p) => ({ ...p, websiteUrl: e.target.value }))}
              />
              <div className="settings-desc" style={{ marginTop: 4 }}>AI จะดึงข้อมูลจาก URL นี้เป็นฐานความรู้</div>
            </div>
          </div>

          {/* ===== PROFILE ===== */}
          <div className="settings-section">
            <div className="settings-section-title">👤 โปรไฟล์</div>
            <div>
              <div className="settings-label" style={{ marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={14} style={{ color: "var(--text-muted)" }} />
                  ชื่อผู้ใช้
                </span>
              </div>
              <input
                type="text"
                className="text-input"
                placeholder="ชื่อของคุณ"
                value={local.userName}
                onChange={(e) => setLocal((p) => ({ ...p, userName: e.target.value }))}
              />
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button className="btn-save" style={{ flex: 2 }} onClick={handleSave}>
              {saved ? "✓ บันทึกแล้ว!" : "บันทึกการตั้งค่า"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
