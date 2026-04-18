"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

// ── Types ──────────────────────────────────────────────────────────────────
type Source = { title: string; url: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  attachmentNames?: string[];
  timestamp: string;
};

type Conversation = {
  _id: string;
  userId: string;
  title: string;
  model: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

type Attachment = {
  id: string;
  name: string;
  type: "text" | "image";
  content: string;
  mimeType?: string;
  preview?: string; // blob URL for image preview
};

// ── Constants ──────────────────────────────────────────────────────────────
const MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Smart)" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (Vision)" },
];

const ACCEPTED_FILES =
  "image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.go,.rs,.html,.css,.xml,.yaml,.yml";

// ── Helpers ────────────────────────────────────────────────────────────────
function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["csv", "xlsx"].includes(ext)) return "📊";
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "go", "rs"].includes(ext)) return "💻";
  if (["json", "xml", "yaml", "yml"].includes(ext)) return "⚙️";
  if (["html", "css"].includes(ext)) return "🌐";
  return "📁";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  // State
  const [userId, setUserId] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [webSearch, setWebSearch] = useState(false);
  const [dark, setDark] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c._id === activeId) ?? null;

  // ── Init: load userId + conversations ──────────────────────────────────
  useEffect(() => {
    let id = localStorage.getItem("chatUserId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chatUserId", id);
    }
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchConversations(userId);
  }, [userId]);

  const fetchConversations = async (uid: string) => {
    try {
      const res = await fetch(`/api/conversations?userId=${uid}`);
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
        // Auto-select first conversation if none active
        if (data.length > 0 && !activeId) {
          setActiveId(data[0]._id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  };

  // ── Scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  // ── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // ── Dark mode class ────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ── Save conversation to MongoDB ───────────────────────────────────────
  const saveConversation = useCallback(
    async (conv: Conversation) => {
      try {
        await fetch(`/api/conversations/${conv._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conv.messages,
            title: conv.title,
            model: conv.model,
          }),
        });
      } catch (e) {
        console.error("Failed to save conversation", e);
      }
    },
    []
  );

  // ── New Chat ───────────────────────────────────────────────────────────
  const newChat = async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: "New Chat", model }),
      });
      if (res.ok) {
        const conv: Conversation = await res.json();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv._id);
        setAttachments([]);
        setInput("");
      }
    } catch (e) {
      console.error("Failed to create conversation", e);
    }
  };

  // ── Delete Conversation ────────────────────────────────────────────────
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeId === id) {
        const remaining = conversations.filter((c) => c._id !== id);
        setActiveId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (e) {
      console.error("Failed to delete conversation", e);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Clear Chat ─────────────────────────────────────────────────────────
  const clearChat = () => {
    if (!activeConv) return;
    const updated = { ...activeConv, messages: [], title: "New Chat" };
    setConversations((prev) =>
      prev.map((c) => (c._id === activeId ? updated : c))
    );
    saveConversation(updated);
  };

  // ── File Upload ────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingFile(true);

    for (const file of fileArray) {
      try {
        // Images: convert client-side for speed
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            const preview = URL.createObjectURL(file);
            setAttachments((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                name: file.name,
                type: "image",
                content: base64,
                mimeType: file.type,
                preview,
              },
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          // All other files: send to upload API
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.type === "image") {
              setAttachments((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: file.name,
                  type: "image",
                  content: data.content,
                  mimeType: data.mimeType,
                },
              ]);
            } else if (data.type === "text") {
              setAttachments((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: file.name,
                  type: "text",
                  content: data.content,
                },
              ]);
            } else if (data.error) {
              alert(`Could not read ${file.name}: ${data.error}`);
            }
          } else {
            const err = await res.json().catch(() => ({ error: "Upload failed" }));
            alert(`Error uploading ${file.name}: ${err.error}`);
          }
        }
      } catch (e) {
        console.error(`Error processing ${file.name}:`, e);
        alert(`Failed to process ${file.name}`);
      }
    }

    setUploadingFile(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  // ── Send Message ───────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading) return;

    // Create conversation if none active
    let convId = activeId;
    let currentConv = activeConv;

    if (!convId || !currentConv) {
      if (!userId) return;
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, title: "New Chat", model }),
        });
        if (!res.ok) return;
        const conv: Conversation = await res.json();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv._id);
        convId = conv._id;
        currentConv = conv;
      } catch {
        return;
      }
    }

    // Build user message
    const attNames = attachments.map((a) => a.name);
    const displayContent =
      text +
      (attNames.length > 0
        ? `\n\n📎 ${attNames.join(", ")}`
        : "");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayContent,
      attachmentNames: attNames,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    const titleUpdate =
      currentConv.title === "New Chat" ? text.slice(0, 45) || attNames[0] || "New Chat" : currentConv.title;

    const updatedConvWithUser: Conversation = {
      ...currentConv,
      title: titleUpdate,
      model,
      messages: [...currentConv.messages, userMsg],
    };

    setConversations((prev) =>
      prev.map((c) => (c._id === convId ? updatedConvWithUser : c))
    );

    const sentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    setLoading(true);

    // Build history for API (use plain text content without attachment names)
    const historyForApi = [
      ...currentConv.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: text || "Please analyze the attached file(s)." },
    ];

    // Separate image and text attachments
    const imageAtt = sentAttachments.find((a) => a.type === "image");
    const textAtts = sentAttachments.filter((a) => a.type === "text");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          model,
          webSearch,
          textAttachments: textAtts.map((a) => ({ name: a.name, content: a.content })),
          imageAttachment: imageAtt
            ? { name: imageAtt.name, content: imageAtt.content, mimeType: imageAtt.mimeType }
            : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };

      const finalConv: Conversation = {
        ...updatedConvWithUser,
        messages: [...updatedConvWithUser.messages, assistantMsg],
      };

      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? finalConv : c))
      );

      // Persist to MongoDB
      saveConversation(finalConv);
    } catch (e: unknown) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${e instanceof Error ? e.message : "Something went wrong. Please try again."}`,
        timestamp: new Date().toISOString(),
      };
      const errConv: Conversation = {
        ...updatedConvWithUser,
        messages: [...updatedConvWithUser.messages, errMsg],
      };
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? errConv : c))
      );
      saveConversation(errConv);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Drag-and-drop ──────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  };

  // ── Theme classes ──────────────────────────────────────────────────────
  const bg = dark ? "bg-[#0f1117]" : "bg-gray-50";
  const sidebarCls = dark
    ? "bg-[#1a1d27] border-[#2a2d3a]"
    : "bg-white border-gray-200";
  const headerCls = dark
    ? "bg-[#1a1d27] border-[#2a2d3a]"
    : "bg-white border-gray-200";
  const chatBg = dark ? "bg-[#0f1117]" : "bg-gray-50";
  const inputCls = dark
    ? "bg-[#1a1d27] border-[#2a2d3a] text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-500";
  const userBubble = dark ? "bg-[#2563eb] text-white" : "bg-blue-600 text-white";
  const aiBubble = dark
    ? "bg-[#1e2130] border border-[#2a2d3a] text-gray-100"
    : "bg-white border border-gray-200 text-gray-800";
  const sidebarItemCls = dark
    ? "hover:bg-[#2a2d3a] text-gray-300"
    : "hover:bg-gray-100 text-gray-700";
  const sidebarActiveCls = dark
    ? "bg-[#2a2d3a] text-white"
    : "bg-blue-50 text-blue-700";
  const attachChipCls = dark
    ? "bg-[#2a2d3a] text-gray-300 border-[#3a3d4a]"
    : "bg-gray-100 text-gray-700 border-gray-200";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen w-screen overflow-hidden ${bg}`} onDragOver={onDragOver} onDrop={onDrop}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside className={`w-64 flex flex-col border-r ${sidebarCls} shrink-0 transition-all`}>
          {/* Logo */}
          <div className="p-4 border-b border-inherit flex items-center justify-between">
            <div>
              <p className={`text-lg font-semibold ${textPrimary}`}>AI Chat</p>
              <p className={`text-xs ${textSecondary}`}>Powered by Groq</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`text-lg p-1 rounded hover:bg-white/10 ${textSecondary}`}
              title="Close sidebar"
            >
              ‹
            </button>
          </div>

          {/* New Chat */}
          <div className="p-3">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <span className="text-lg leading-none">+</span> New Chat
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {conversations.length === 0 ? (
              <p className={`text-xs text-center mt-6 ${textSecondary}`}>
                No conversations yet
              </p>
            ) : (
              conversations.map((c) => (
                <div key={c._id} className="group relative flex items-center">
                  <button
                    onClick={() => setActiveId(c._id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors pr-8 ${
                      c._id === activeId ? sidebarActiveCls : sidebarItemCls
                    }`}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={(e) => deleteConversation(c._id, e)}
                    disabled={deletingId === c._id}
                    className={`absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded text-xs transition-opacity ${
                      dark
                        ? "text-gray-500 hover:text-red-400 hover:bg-red-900/30"
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                    title="Delete conversation"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t border-inherit ${textSecondary} text-xs`}>
            Sneha G Sajjan
          </div>
        </aside>
      )}

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className={`flex items-center justify-between px-4 py-3 border-b ${headerCls} shrink-0 gap-3`}>
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`text-lg p-1 rounded hover:bg-white/10 ${textSecondary} shrink-0`}
              >
                ›
              </button>
            )}
            <div className="min-w-0">
              <p className={`font-semibold truncate ${textPrimary}`}>
                {activeConv?.title ?? "New Chat"}
              </p>
              <p className={`text-xs ${textSecondary}`}>Powered by Groq</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* Web search toggle */}
            <button
              onClick={() => setWebSearch((v) => !v)}
              title={webSearch ? "Web search ON" : "Web search OFF"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                webSearch
                  ? "bg-blue-600 text-white border-blue-600"
                  : dark
                  ? "text-gray-400 border-[#2a2d3a] hover:border-gray-500"
                  : "text-gray-500 border-gray-300 hover:border-gray-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Web
            </button>

            {/* Model selector */}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`text-xs rounded-lg px-2 py-1.5 border outline-none cursor-pointer ${
                dark
                  ? "bg-[#1a1d27] border-[#2a2d3a] text-gray-300"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Clear */}
            <button
              onClick={clearChat}
              disabled={!activeConv || activeConv.messages.length === 0}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                dark
                  ? "border-[#2a2d3a] text-gray-400 hover:text-white hover:border-gray-500"
                  : "border-gray-300 text-gray-500 hover:text-gray-800"
              }`}
            >
              Clear
            </button>

            {/* Dark mode */}
            <button
              onClick={() => setDark((v) => !v)}
              className="text-xl p-1"
              title="Toggle theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 ${chatBg}`}>
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <span className="text-5xl">💬</span>
              <p className={`text-base font-medium ${textPrimary}`}>Start a conversation</p>
              <p className={`text-sm ${textSecondary} text-center max-w-xs`}>
                Ask anything, upload files, or enable web search for live results.
              </p>
              {!userId && (
                <p className={`text-xs ${textSecondary}`}>Loading your history…</p>
              )}
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user" ? userBubble : aiBubble
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-black/20 prose-code:text-blue-400">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      <p className="text-xs text-blue-400 font-medium">Sources</p>
                      {msg.sources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {s.title}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.role === "user" ? "text-blue-200/70" : textSecondary
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl px-4 py-3 ${aiBubble}`}>
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div className={`px-4 py-3 border-t ${headerCls} shrink-0`}>
          {/* Web search indicator */}
          {webSearch && (
            <div className={`mb-2 flex items-center gap-1.5 text-xs text-blue-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Web search enabled — responses include live results
            </div>
          )}

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${attachChipCls}`}
                >
                  {att.type === "image" && att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.name}
                      className="w-4 h-4 rounded object-cover"
                    />
                  ) : (
                    <span>{fileIcon(att.name)}</span>
                  )}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="text-gray-400 hover:text-red-400 leading-none ml-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {uploadingFile && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${attachChipCls}`}>
                  <span className="animate-spin">⏳</span>
                  <span>Processing…</span>
                </div>
              )}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            {/* File inputs (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore - webkitdirectory is not in TS types
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            {/* Attach button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 disabled:opacity-40 ${
                  dark
                    ? "border-[#2a2d3a] text-gray-400 hover:text-white hover:border-gray-500 hover:bg-[#2a2d3a]"
                    : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                }`}
                title="Attach files"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              {/* Folder option tooltip */}
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={uploadingFile}
                className={`hidden group-hover:flex absolute -top-9 left-0 items-center gap-1 px-2 py-1 rounded-lg text-xs whitespace-nowrap border transition-colors disabled:opacity-40 z-10 ${
                  dark
                    ? "bg-[#1a1d27] border-[#2a2d3a] text-gray-300 hover:bg-[#2a2d3a]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow"
                }`}
                title="Upload folder"
              >
                📁 Folder
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                attachments.length > 0
                  ? "Ask about the attached file(s)…"
                  : "Type a message… (Shift+Enter for new line)"
              }
              className={`flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${inputCls}`}
            />

            {/* Send */}
            <button
              onClick={send}
              disabled={(!input.trim() && attachments.length === 0) || loading || uploadingFile}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
            >
              Send
            </button>
          </div>

          {/* Drag & drop hint */}
          <p className={`text-xs text-center mt-2 ${textSecondary} opacity-60`}>
            Drop files anywhere to attach · Supports images, PDF, DOCX, code &amp; text files
          </p>
        </div>
      </div>
    </div>
  );
}
