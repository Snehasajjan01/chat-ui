"use client"

import { useState } from "react"
import { Message as MessageType } from "@/types"
import ReactMarkdown from "react-markdown"

type Props = {
  message: MessageType
}

export default function Message({ message }: Props) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex w-full mb-3 animate-fade-in group ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2 rounded-2xl text-sm ${
            isUser
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`absolute -bottom-5 ${isUser ? "right-0" : "left-0"} 
            opacity-0 group-hover:opacity-100 transition-opacity text-xs 
            px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600`}
        >
          {copied ? "✅ Copied!" : "Copy"}
        </button>
      </div>
    </div>
  )
}