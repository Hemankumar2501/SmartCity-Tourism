import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: body.message,
        history: body.history || [],
        itinerary_context: body.itinerary || null,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `FastAPI responded with error: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Next.js Chat API handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
