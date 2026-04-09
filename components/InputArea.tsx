"use client"

import { useState } from "react"

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
    <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm outline-none focus:border-blue-400 dark:focus:border-blue-400 disabled:opacity-50"
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