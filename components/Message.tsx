import { Message as MessageType } from "@/types"

type Props = {
  message: MessageType
}

export default function Message({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex w-full mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        <p>{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}