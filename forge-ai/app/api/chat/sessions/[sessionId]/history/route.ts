import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Query messages for this session
    const messages = await sql`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at
    }));

    return NextResponse.json(formattedMessages, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    console.error("Error retrieving chat history:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat history", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
