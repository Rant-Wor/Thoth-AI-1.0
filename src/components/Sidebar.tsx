"use client";

import { Plus, MessageSquare, Archive, FileText, Edit3, Settings, ChevronRight } from "lucide-react";
import { Chat } from "@/lib/store";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onOpenSettings: () => void;
  onShowArchived: () => void;
  onShowTemplates: () => void;
  onShowDrafts: () => void;
  activeView: "chat" | "archived" | "templates" | "drafts";
  userName: string;
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onOpenSettings,
  onShowArchived,
  onShowTemplates,
  onShowDrafts,
  activeView,
  userName,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">CZS AI</div>
        <div className="sidebar-subtitle">by INT · Your Digital Sanctuary</div>
      </div>

      {/* New Chat */}
      <button className="btn-new-chat" onClick={onNewChat}>
        <Plus size={16} />
        แชทใหม่
      </button>

      {/* Nav Items */}
      <div className="sidebar-nav">
        <button
          className={`nav-item${activeView === "chat" ? " active" : ""}`}
          onClick={() => activeChatId && onSelectChat(activeChatId)}
        >
          <MessageSquare size={16} />
          แชทล่าสุด
        </button>
        <button
          className={`nav-item${activeView === "archived" ? " active" : ""}`}
          onClick={onShowArchived}
        >
          <Archive size={16} />
          เก็บถาวร
        </button>
        <button
          className={`nav-item${activeView === "templates" ? " active" : ""}`}
          onClick={onShowTemplates}
        >
          <FileText size={16} />
          แม่แบบ (Templates)
        </button>
        <button
          className={`nav-item${activeView === "drafts" ? " active" : ""}`}
          onClick={onShowDrafts}
        >
          <Edit3 size={16} />
          ร่าง (Drafts)
        </button>

        {/* Recent Chats */}
        {chats.length > 0 && (
          <>
            <div className="sidebar-section-label">ประวัติแชท</div>
            {chats.slice(0, 10).map((chat) => (
              <button
                key={chat.id}
                className={`chat-history-item${activeChatId === chat.id ? " active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
                title={chat.title}
              >
                <MessageSquare size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {chat.title}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={onOpenSettings}>
          <Settings size={16} />
          การตั้งค่า
          <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
        </button>
        <div className="user-info">
          <div className="user-avatar">
            {(userName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="user-name">{userName || "ผู้ใช้"}</div>
            <div className="user-role">Premium Member</div>
          </div>
        </div>
      </div>
    </div>
  );
}
