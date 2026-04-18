"use client"
// This makes the component run on the client side (browser)

import { useState } from "react"
// useState → used to store and update input value

// Defining props that this component receives
type Props = {
  onSend: (message: string) => void // Function passed from parent to send message
  isLoading: boolean  // Indicates if API call is in progress
}

export default function InputArea({ onSend, isLoading }: Props) {
  //Stores user input
  const [input, setInput] = useState("")
  // Function to handle sending message
  const handleSend = () => {
    // Prevent sending empty or whitespace-only messages
    if (input.trim() === "") return
    // Call parent function (ChatWindow) and pass message
    onSend(input.trim())
    // Clear input box after sending
    setInput("")
  }
   // Function to handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user presses "Enter" key → send message
    if (e.key === "Enter") handleSend()
  }

  return (
    // Main container (flex layout for input + button)
    <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
       {/* Input field */}
      <input
        type="text" // Input type text
        value={input} // Controlled component (value from state)
        onChange={(e) => setInput(e.target.value)} // Updates state whenever user types
        onKeyDown={handleKeyDown} // Listens for key press (Enter)
        placeholder="Type a message..." // Placeholder text
        disabled={isLoading} // Disable input while loading (prevents multiple requests)
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm outline-none focus:border-blue-400 dark:focus:border-blue-400 disabled:opacity-50"
      />
 {/* Send Button */}
      <button
        onClick={handleSend}
         // Calls handleSend when clicked
        disabled={input.trim() === "" || isLoading}
          // Disable if input is empty OR API is loading
        className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors"
      >
        Send
      </button>
    </div>
  )
}