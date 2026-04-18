"use client"
// This makes the component run on the client side (browser)

import { useState } from "react"
// useState → used to manage local state (copied status)
import { Message as MessageType } from "@/types"
// Importing the Message type for type safety (TypeScript)
import ReactMarkdown from "react-markdown"
// Library to render markdown content (bold, lists, code, etc.)

// Defining props type → this component receives a message object
type Props = {
  message: MessageType
}
// Functional component
export default function Message({ message }: Props) {
  // Check if message is from user or assistant
  const isUser = message.role === "user"
  // State to track if text is copied
  const [copied, setCopied] = useState(false)
  // Function to copy message content
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    // Copies text to clipboard
    setCopied(true)
    // Show "Copied!" temporarily
    setTimeout(() => setCopied(false), 2000)
    // Reset after 2 seconds
  }

  return (
    // Outer container → controls alignment and animation
    <div className={`flex w-full mb-3 animate-fade-in group ${isUser ? "justify-end" : "justify-start"}`}>
      {/* If user → right side, else left side */}
      <div className={`relative max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        
        {/* Limits message width to 70% */}
        <div
          className={`px-4 py-2 rounded-2xl text-sm ${
            isUser
              ? "bg-blue-500 text-white rounded-br-none" // User message → blue bubble (right side)
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none" // Bot message → gray bubble (left side)
          }`}
        >
           {/* If user message → show plain text */}
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            // If assistant → render markdown content
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
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
               {/* Markdown content rendered here */}
            </ReactMarkdown>
          )}
            {/* Timestamp */}
          <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
             {/* Formats time like 10:30 AM */}
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
           // When clicked → copies message
          className={`absolute -bottom-5 ${isUser ? "right-0" : "left-0"} 
            opacity-0 group-hover:opacity-100 transition-opacity text-xs 
            px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600`}
        >
           {/* Button appears only on hover */}

          {copied ? "✅ Copied!" : "Copy"}
          {/* Toggle text */}
        </button>
      </div>
    </div>
  )
}