"use client"

import { useState, useRef, useEffect } from "react"
import { Message as MessageType } from "@/types"
import Message from "./Message"
import InputArea from "./InputArea"

export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">AI Assistant</h1>
        <p className="text-xs text-gray-400">Always here to help</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            Send a message to start chatting!
          </p>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
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