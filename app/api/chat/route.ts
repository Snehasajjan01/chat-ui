import { NextRequest, NextResponse } from "next/server"

const mockResponses = [
  "Here are **three tips** for you:\n- Stay consistent\n- Ask questions\n- Practice daily",
  "Great question! The answer involves:\n1. **Planning** your approach\n2. **Executing** step by step\n3. **Reviewing** your work",
  "Here's a quick code example:\n`console.log('Hello World')`\n\nThis prints to the console!",
  "**Summary:** This is a _mock_ AI assistant built with Next.js and TypeScript.",
  "I'd approach this in **two phases**:\n\n**Phase 1:** Research\n**Phase 2:** Implementation",
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