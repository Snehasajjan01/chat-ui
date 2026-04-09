"use client"  // ← Line 1: tells Next.js this runs in the browser

import { useState } from "react"  // ← Line 2: imports useState

type Props = {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function InputArea({ onSend, isLoading }: Props) {
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (input.trim() === "") return
    onSend(input.trim())
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend()
  }

  return (
    <div className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-sm outline-none focus:border-blue-400 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={input.trim() === "" || isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors"
      >
        Send
      </button>
    </div>
  )
}