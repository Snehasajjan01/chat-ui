"use client"

import { useState, useRef, useEffect } from "react"
import { Message as MessageType } from "@/types"
import Message from "./Message"
import InputArea from "./InputArea"
import Sidebar from "./Sidebar"
import { useDarkMode } from "@/hooks/useDarkMode"

type Conversation = {
  id: string
  title: string
  createdAt: Date
}

export default function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>(() => crypto.randomUUID())
  const [allMessages, setAllMessages] = useState<Record<string, MessageType[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSoundOn, setIsSoundOn] = useState(true)
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant")
  const { isDark, toggle } = useDarkMode()
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = allMessages[activeId] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages, activeId])

  const handleNew = () => {
    const newId = crypto.randomUUID()
    setActiveId(newId)
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
  }

  const playDing = () => {
    if (!isSoundOn) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  }

  const handleSend = async (content: string) => {
    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    // Add to current conversation
    setAllMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), userMessage],
    }))

    // Create conversation entry if first message
    if (!conversations.find((c) => c.id === activeId)) {
      setConversations((prev) => [
        {
          id: activeId,
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
          createdAt: new Date(),
        },
        ...prev,
      ])
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId: activeId,
          model: selectedModel,
          history: (allMessages[activeId] || []).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      const botMessage: MessageType = {
        id: crypto.randomUUID(),
        content: data.reply,
        role: "assistant",
        timestamp: new Date(),
      }

      setAllMessages((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), botMessage],
      }))

      playDing()
    } catch (error) {
      const errorMessage: MessageType = {
        id: crypto.randomUUID(),
        content: "Something went wrong. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setAllMessages((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), errorMessage],
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setAllMessages((prev) => ({ ...prev, [activeId]: [] }))
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={handleNew}
        onSelect={handleSelect}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              {conversations.find((c) => c.id === activeId)?.title || "New Chat"}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Powered by Groq</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="gemma2-9b-it">Gemma 2 9B</option>
            </select>
            <button
              onClick={clearChat}
              disabled={messages.length === 0}
              className="text-sm px-3 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 hover:bg-red-200 disabled:opacity-40 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              className="text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isSoundOn ? "🔔" : "🔕"}
            </button>
            <button
              onClick={toggle}
              className="text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-2xl">💬</p>
              <p className="text-gray-400 dark:text-gray-600 text-sm">
                Start a new conversation!
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <InputArea onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  )
}