export type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}
export type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export type DBMessage = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export type ChatSession = {
  _id?: string
  sessionId: string
  messages: DBMessage[]
  createdAt: Date
  updatedAt: Date
}