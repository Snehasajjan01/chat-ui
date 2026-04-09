"use client"

import { useState, useRef, useEffect } from "react"
import { Message as MessageType } from "@/types"
import Message from "./Message"
import InputArea from "./InputArea"
import { useDarkMode } from "@/hooks/useDarkMode"

export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSoundOn, setIsSoundOn] = useState(true)
  const { isDark, toggle } = useDarkMode()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })

      const data = await res.json()

      const botMessage: MessageType = {
        id: crypto.randomUUID(),
        content: data.reply,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
      playDing()
    } catch (error) {
      const errorMessage: MessageType = {
        id: crypto.randomUUID(),
        content: "Something went wrong. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">AI Assistant</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Always here to help</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-sm px-3 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-40 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isSoundOn ? "Mute sounds" : "Unmute sounds"}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-600 text-sm mt-10">
            Send a message to start chatting!
          </p>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}

        {/* Typing Indicator */}
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

      {/* Input */}
      <InputArea onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}