import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);
  const db = await getDb();
  if (!db) return NextResponse.json([]);
  try {
    const conversations = await db
      .collection("conversations")
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json(
      conversations.map((c) => ({ ...c, _id: c._id.toString() }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const now = new Date().toISOString();
  try {
    const body = await req.json();
    const { userId, title, model } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const db = await getDb();
    if (!db) {
      return NextResponse.json({
        _id: crypto.randomUUID(), userId,
        title: title || "New Chat",
        model: model || "llama-3.1-8b-instant",
        messages: [], createdAt: now, updatedAt: now, _noDb: true,
      });
    }
    const doc = {
      userId, title: title || "New Chat",
      model: model || "llama-3.1-8b-instant",
      messages: [], createdAt: now, updatedAt: now,
    };
    const result = await db.collection("conversations").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId.toString() });
  } catch {
    return NextResponse.json({
      _id: crypto.randomUUID(), userId: "unknown",
      title: "New Chat", model: "llama-3.1-8b-instant",
      messages: [], createdAt: now, updatedAt: now, _noDb: true,
    });
  }
}