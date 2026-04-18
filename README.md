# Chat UI — Metawurks Internship Task 1

A full-featured AI chat interface built with Next.js, TypeScript, and Tailwind CSS — powered by Groq's blazing-fast LLM inference.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange)

---

## Features

- **Multi-model AI chat** — Switch between Llama 3.1 8B, Llama 3.3 70B, Gemma 2 9B, and Llama 4 Scout (vision)
- **Live web search** — Toggle web search to get real-time answers via SerpAPI
- **File uploads** — Attach images, PDFs, DOCX, text, code, CSV, JSON and ask questions about them
- **Vision support** — Upload images and have the AI analyze them (auto-switches to vision model)
- **MongoDB persistence** — Conversations are saved to MongoDB and restored when you revisit
- **Conversation history** — Sidebar shows all past chats; pick up where you left off
- **Dark / Light mode** — Toggle with one click
- **Drag & drop uploads** — Drop files anywhere on the chat window
- **Markdown rendering** — AI responses render with full markdown (code blocks, lists, headers)
- **Copy message** — Hover any message to copy its content
- **Responsive design** — Works on desktop and mobile
- **Error handling** — Graceful fallback if MongoDB or web search is unavailable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Inference | Groq SDK (Llama, Gemma models) |
| Database | MongoDB Atlas |
| Web Search | SerpAPI |
| File Parsing | pdf-parse, mammoth |
| Markdown | react-markdown |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/chat-ui.git
cd chat-ui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
# Groq API — https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# MongoDB Atlas — https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# SerpAPI (optional — enables web search) — https://serpapi.com
SERPAPI_KEY=your_serpapi_key
```

> The app works without MongoDB and SerpAPI — those features just won't persist or search the web.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
chat-ui/
├── app/
│   ├── page.tsx                        # Main chat UI
│   └── api/
│       ├── chat/route.ts               # Groq LLM + web search handler
│       ├── conversations/
│       │   ├── route.ts                # GET / POST conversations
│       │   └── [id]/route.ts           # PUT / DELETE conversation
│       └── upload/route.ts             # File upload + text extraction
├── lib/
│   ├── mongodb.ts                      # MongoDB connection with graceful fallback
│   └── types.ts                        # Shared TypeScript types
└── .env.local                          # Environment variables (not committed)
```

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Add environment variables in **Settings → Environment Variables**:
   - `GROQ_API_KEY`
   - `MONGODB_URI`
   - `SERPAPI_KEY`
4. In MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` (required for Vercel's dynamic IPs)
5. Redeploy — your app is live!

---

## Supported File Types

| Type | Formats |
|---|---|
| Images | jpg, jpeg, png, gif, webp |
| Documents | pdf, docx, doc |
| Code | js, ts, tsx, jsx, py, java, cpp, c, go, rs |
| Text | txt, md, csv, json, xml, yaml, html, css |

---

## Available Models

| Model | Best For |
|---|---|
| Llama 3.1 8B | Fast everyday questions |
| Llama 3.3 70B | Complex reasoning |
| Gemma 2 9B | Balanced speed + quality |
| Llama 4 Scout | Image analysis (auto-selected when image attached) |

---

## Author

**Sneha G Sajjan** — Metawurks Internship Task 1