import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Currently active Groq models (updated April 2026) ──────────────────────
const TEXT_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "gemma2-9b-it",
  "llama3-70b-8192",
  "llama3-8b-8192",
];
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

// Prefer the best available vision model
const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── SerpApi web search ─────────────────────────────────────────────────────
async function serpSearch(query: string): Promise<{
  context: string;
  sources: { title: string; url: string }[];
}> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured");

  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: "google",
    num: "6",
    hl: "en",
    gl: "us",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpApi error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const sources: { title: string; url: string }[] = [];
  const snippets: string[] = [];

  if (data.answer_box) {
    const ab = data.answer_box;
    const answer = ab.answer ?? ab.snippet ?? ab.result ?? "";
    if (answer) snippets.push(`[Direct Answer] ${answer}`);
  }

  if (data.knowledge_graph?.description) {
    snippets.push(`[Knowledge Graph] ${data.knowledge_graph.description}`);
  }

  const organic: { title?: string; link?: string; snippet?: string }[] =
    data.organic_results ?? [];

  for (const r of organic.slice(0, 6)) {
    if (r.title && r.link) sources.push({ title: r.title, url: r.link });
    if (r.snippet) snippets.push(`[${r.title ?? r.link}] ${r.snippet}`);
  }

  return { context: snippets.join("\n\n"), sources };
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      model = "llama-3.1-8b-instant",
      webSearch = false,
      // File attachments from client
      textAttachments = [] as { name: string; content: string }[],
      imageAttachment = null as {
        name: string;
        content: string; // base64
        mimeType: string;
      } | null,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Select model — use vision model if image attached
    const hasImage = !!imageAttachment;
    let selectedModel = hasImage
      ? DEFAULT_VISION_MODEL
      : TEXT_MODELS.includes(model)
      ? model
      : "llama-3.1-8b-instant";

    let sources: { title: string; url: string }[] = [];

    // ── Base system prompt ─────────────────────────────────────────────────
    const BASE_PROMPT = `You are an intelligent AI assistant. Be helpful, accurate, and concise.
- Maintain context across the conversation.
- If web search results are provided, use them as the primary source for current information.
- If file content is provided, analyze it carefully to answer questions about it.
- Format responses using Markdown for clarity (headers, lists, code blocks where appropriate).`;

    let systemPrompt = BASE_PROMPT;

    // ── Inject text file content ───────────────────────────────────────────
    if (textAttachments.length > 0) {
      const fileBlock = textAttachments
        .map(
          (f: { name: string; content: string }) =>
            `--- File: ${f.name} ---\n${f.content}\n--- End of ${f.name} ---`
        )
        .join("\n\n");
      systemPrompt += `\n\n## Attached Files\n${fileBlock}`;
    }

    // ── Web search ─────────────────────────────────────────────────────────
    if (webSearch) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");

      if (lastUserMsg) {
        try {
          const { context, sources: found } = await serpSearch(
            typeof lastUserMsg.content === "string"
              ? lastUserMsg.content
              : lastUserMsg.content?.find?.((c: { type: string }) => c.type === "text")?.text ?? ""
          );
          sources = found;

          if (context) {
            systemPrompt += `\n\n## Live Web Search Results (${new Date().toDateString()})\n${context}`;
          }
        } catch (searchErr) {
          console.error("Web search error:", searchErr);
          systemPrompt += "\n\n(Web search was requested but temporarily unavailable.)";
        }
      }
    }

    // ── Build Groq message array ───────────────────────────────────────────
    type GroqContent =
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;

    const groqMessages: { role: "user" | "assistant"; content: GroqContent }[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // ── Attach image to last user message ──────────────────────────────────
    if (hasImage && imageAttachment) {
      const lastIdx = groqMessages.length - 1;
      const lastMsg = groqMessages[lastIdx];
      const textPart =
        typeof lastMsg.content === "string" ? lastMsg.content : "Please analyze this file.";

      groqMessages[lastIdx] = {
        role: "user",
        content: [
          { type: "text", text: textPart || "Please analyze this image." },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageAttachment.mimeType};base64,${imageAttachment.content}`,
            },
          },
        ],
      };

      // Fallback to a known working vision model if primary fails
      if (!VISION_MODELS.includes(selectedModel)) {
        selectedModel = "llama-3.2-11b-vision-preview";
      }
    }

    // ── Groq completion ────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const content =
      completion.choices[0]?.message?.content ?? "No response generated.";

    return NextResponse.json({ content, sources, modelUsed: selectedModel });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}