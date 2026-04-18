"use client"

type Conversation = {
  id: string
  title: string
  createdAt: Date
}

type Props = {
  conversations: Conversation[]
  activeId: string
  onNew: () => void
  onSelect: (id: string) => void
}

export default function Sidebar({ conversations, activeId, onNew, onSelect }: Props) {
  return (
    <div className="w-64 h-screen flex flex-col bg-gray-900 dark:bg-gray-950 border-r border-gray-700">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-700">
        <h1 className="text-white font-bold text-lg">AI Chat</h1>
        <p className="text-gray-400 text-xs">Powered by Groq</p>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
        >
          <span className="text-lg">+</span>
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {conversations.length === 0 ? (
          <p className="text-gray-500 text-xs text-center mt-4">No conversations yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 text-xs px-2 mb-1">Recent</p>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeId === conv.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-gray-500 text-xs">Sneha G Sajjan</p>
      </div>
    </div>
  )
}