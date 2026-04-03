"use client";

// Simple in-memory store for app state
// In production, use Zustand or Context API

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export interface AppSettings {
  openaiKey: string;
  model: string;
  darkMode: boolean;
  systemPrompt: string;
  uploadedFiles: UploadedFile[];
  googleDriveLink: string;
  websiteUrl: string;
  userName: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export const DEFAULT_SETTINGS: AppSettings = {
  openaiKey: "",
  model: "gpt-4.1-mini",
  darkMode: false,
  systemPrompt:
    "คุณคือ Thoth ☾✧ ผู้ช่วย AI อัจฉริยะของ INT คุณตอบคำถามด้วยความแม่นยำ กระชับ และเป็นมิตร ตอบเป็นภาษาไทยเมื่อถูกถามเป็นภาษาไทย และตอบเป็นภาษาอังกฤษเมื่อถูกถามเป็นภาษาอังกฤษ",
  uploadedFiles: [],
  googleDriveLink: "",
  websiteUrl: "",
  userName: "ผู้ใช้",
};
