import { NextRequest, NextResponse } from "next/server"

const mockResponses = [
  "That's a great question! Let me think about that.",
  "Interesting point! Here's what I know about that.",
  "I understand what you mean. Here's my take on it.",
  "Thanks for sharing that! Here's something useful.",
  "Good thinking! I'd approach it this way.",
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const userMessage = body.message

  if (!userMessage) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    )
  }

  // Simulate thinking delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const randomReply =
    mockResponses[Math.floor(Math.random() * mockResponses.length)]

  return NextResponse.json({ reply: randomReply })
}