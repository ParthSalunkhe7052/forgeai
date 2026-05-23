import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import crypto from "crypto";

const SYSTEM_PROMPTS: Record<string, string> = {
  cxo: `You are Forge AI, an industrial intelligence copilot for a steel manufacturing enterprise. You are speaking with the CXO/Executive. Focus on: revenue, profit, plant utilization, costs, risks, and business outcomes. Never discuss machine-level details unless they directly affect business metrics. Be concise, confident, and data-driven. Always quantify impact in ₹ (Indian Rupees) and tons.`,

  technical: `You are Forge AI, speaking with the Technical Manager. Focus on: OEE, equipment health, MTBF, MTTR, failure prediction, root cause analysis, sensor data, and maintenance planning. Be specific with machine names, measurements, and technical details. Always suggest specific actions.`,

  floor: `You are Forge AI, speaking with the Floor Manager. Focus on: current shift performance, production pace, work orders, material flow, team allocation, and immediate actions needed in the next 2–4 hours. Use simple language. Be direct about priorities.`
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, content, role_context = "cxo", plant_id = null } = body;

    if (!session_id || !content) {
      return NextResponse.json({ error: "session_id and content are required" }, { status: 400 });
    }

    // 1. Fetch Plant Name context if available
    let plantName = "All Plants";
    if (plant_id && plant_id !== "all") {
      try {
        const plants = await sql`SELECT name FROM plants WHERE id = ${plant_id}`;
        if (plants.length > 0) {
          plantName = plants[0].name;
        }
      } catch (err) {
        console.warn("Could not query plant name for chat context:", err);
      }
    }

    // 2. Save User Message to database
    try {
      const userMsgId = crypto.randomUUID();
      await sql`
        INSERT INTO chat_messages (id, session_id, role, content, role_context, plant_id, created_at)
        VALUES (${userMsgId}, ${session_id}, 'user', ${content}, ${role_context}, ${plant_id || null}, NOW())
      `;
    } catch (dbErr) {
      console.error("Error saving user message to database:", dbErr);
    }

    // 3. Request Streaming Response from Gemini API compatibility layer
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = (SYSTEM_PROMPTS[role_context] || SYSTEM_PROMPTS.cxo) + `\nActive Plant Context: ${plantName}`;

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        stream: true
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API returned error HTTP ${geminiRes.status}: ${errText}`);
    }

    // 4. Return ReadableStream to client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = geminiRes.body?.getReader();

    if (!reader) {
      throw new Error("Failed to get reader from Gemini API stream response.");
    }

    let accumulatedResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;
              if (cleanLine === "data: [DONE]") break;

              if (cleanLine.startsWith("data: ")) {
                try {
                  const json = JSON.parse(cleanLine.substring(6));
                  const token = json.choices?.[0]?.delta?.content || "";
                  if (token) {
                    accumulatedResponse += token;
                    controller.enqueue(encoder.encode(token));
                  }
                } catch (e) {
                  // ignore JSON parse errors on incomplete buffer chunks
                }
              }
            }
          }

          // Save Assistant response to database after stream finishes
          if (accumulatedResponse.trim()) {
            try {
              const assistantMsgId = crypto.randomUUID();
              await sql`
                INSERT INTO chat_messages (id, session_id, role, content, role_context, plant_id, created_at)
                VALUES (${assistantMsgId}, ${session_id}, 'assistant', ${accumulatedResponse}, ${role_context}, ${plant_id || null}, NOW())
              `;
            } catch (dbErr) {
              console.error("Error saving assistant message to database:", dbErr);
            }
          }
        } catch (streamErr) {
          console.error("Error processing stream:", streamErr);
          controller.enqueue(encoder.encode("\n[Error streaming response. Please verify network connections.]"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });

  } catch (error: any) {
    console.error("Error in chat messages API:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
