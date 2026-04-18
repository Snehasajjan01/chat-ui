import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function isValidObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { messages, title, model } = body;
    const db = await getDb();
    if (!db || !isValidObjectId(id))
      return NextResponse.json({ success: true, persisted: false });
    const updateFields: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (messages !== undefined) updateFields.messages = messages;
    if (title !== undefined) updateFields.title = title;
    if (model !== undefined) updateFields.model = model;
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    return NextResponse.json({ success: true, persisted: true });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ success: true, persisted: false });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await getDb();
    if (!db || !isValidObjectId(id))
      return NextResponse.json({ success: true });
    await db.collection("conversations").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ success: true });
  }
}