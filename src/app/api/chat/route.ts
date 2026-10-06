import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import {
  FEEDBACKS,
  FIELD_FORCES,
  PRODUCTS,
  RECOMMENDATIONS,
  getDashboardSummary,
  DEPARTMENTS,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(): string {
  const summary = getDashboardSummary();
  const topCategories = summary.categoryBreakdown
    .slice(0, 4)
    .map((c) => `${c.category}: ${c.count}`)
    .join(", ");
  const topProducts = [...PRODUCTS]
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 6)
    .map((p) => `${p.name} (${p.mentionCount} mentions)`)
    .join(", ");
  const recs = RECOMMENDATIONS.map(
    (r) =>
      `- ${r.title} [status: ${r.status}, impact: ${r.impact}, owner: ${r.owner}]`
  ).join("\n");

  return `You are "ACI Insight", the analytical assistant embedded in the ACI Field Feedback Console. ACI is a large Bangladeshi conglomerate. You help managers interpret field-force feedback data and decide next actions.

You are speaking with a pharma department manager. Be concise, formal and decision-oriented. Use short paragraphs and bullet points. Never invent numbers — use only the figures provided below.

CURRENT DASHBOARD SNAPSHOT (Pharma department, ${summary.dateRange.earliest} → ${summary.dateRange.latest}):
- Total feedbacks submitted: ${summary.totalFeedbacks}
- Field forces that submitted: ${summary.submittedFieldForces} of ${summary.totalFieldForces} (${summary.notSubmittedFieldForces} did not submit)
- Products mentioned: ${summary.productsMentioned}
- Recommendations generated: ${summary.recommendationsCount}
- Sentiment split — positive: ${summary.sentimentBreakdown.positive}, neutral: ${summary.sentimentBreakdown.neutral}, negative: ${summary.sentimentBreakdown.negative}
- Top categories: ${topCategories}
- Top mentioned products: ${topProducts}

RECOMMENDATIONS ON FILE:
${recs}

Departments in scope: ${DEPARTMENTS.map((d) => d.name).join(", ")} (only Pharma currently has live feedback; others are onboarded but not yet collecting).

When asked "where would digital tools save the field the most time" or similar, ground your answer in the Process Issues / Service Feedback categories (which capture field-app and resource friction) and the related recommendations. When asked about most-reported issues, refer to the top categories above. If a question is outside the feedback domain, politely steer back to feedback insights. Always finish a substantive answer with a short "Suggested next action" line.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : body?.message
        ? [{ role: "user", content: body.message }]
        : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No message provided." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = buildSystemPrompt();
    const completion = await generateWithGemini(apiKey, {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
    });
    const reply =
      completion.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ||
      "I'm sorry, I couldn't generate a response right now. Please try rephrasing your question.";

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] error:", message);
    return NextResponse.json(
      {
        reply:
          "I'm having trouble reaching the analysis engine right now. Please try again in a moment.",
        error: message,
      },
      { status: 200 }
    );
  }
}
