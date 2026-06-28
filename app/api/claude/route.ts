import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set" },
      { status: 503 }
    );
  }

  const { content, messages, system, maxTokens } = await req.json();

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens || 1024,
    messages: messages ?? [{ role: "user", content }],
  };
  if (system) body.system = system;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return NextResponse.json({ error: err }, { status: upstream.status });
  }

  const data = await upstream.json();
  const text = (data.content as Array<{ type: string; text: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return NextResponse.json({ text });
}
