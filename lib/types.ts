export type MessageRole = "user" | "assistant";

export type Attachment = {
  id: string;
  name: string;
  type: "text" | "image";
  content: string; // text content or base64 for images
  mimeType?: string;
  preview?: string; // blob URL for image preview
};

export type Source = {
  title: string;
  url: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  attachments?: { name: string; type: string }[];
  timestamp: string; // ISO string for JSON serialization
};

export type Conversation = {
  _id?: string;
  userId: string;
  title: string;
  model: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};