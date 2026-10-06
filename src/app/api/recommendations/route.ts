import { NextResponse } from "next/server";
import { FEEDBACKS, type FeedbackCategory, type Recommendation } from "@/lib/mock-data";
import { generateWithGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const CATEGORIES: FeedbackCategory[] = [
  "Product Feedback",
  "Product Issues",
  "Experience Feedback",
  "General Feedback",
  "Service Feedback",
  "Process Issues",
  "Service Issues",
];

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const feedback = FEEDBACKS.map((item) => ({
    id: item.id,
    category: item.category,
    subCategory: item.subCategory,
    sentiment: item.sentiment,
    summary: item.summary,
    detail: item.detail,
  }));
  const prompt = `Analyze this ACI Pharma field feedback and create 5 prioritized, actionable recommendations grounded only in this data.

Return only a JSON array. Each object must have: title (string), description (string), category (one of ${CATEGORIES.join(", ")}), sourceFeedbackIds (array of feedback IDs from the input), impact (high|medium|low), effort (high|medium|low), owner (string).
Avoid duplicating recommendations. Cite only the feedback IDs that support each action. Do not invent metrics or facts.

Feedback data:
${JSON.stringify(feedback)}`;

  try {
    const result = await generateWithGemini(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "low" },
      },
    });
    const text = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("");
    const generated = JSON.parse(text ?? "") as Array<{
      title: string;
      description: string;
      category: FeedbackCategory;
      sourceFeedbackIds: string[];
      impact: Recommendation["impact"];
      effort: Recommendation["effort"];
      owner: string;
    }>;
    if (!Array.isArray(generated) || generated.length === 0) {
      throw new Error("Gemini returned no recommendations.");
    }

    const feedbackIds = new Set(FEEDBACKS.map((item) => item.id));
    const recommendations: Recommendation[] = generated.map((item, index) => {
      if (
        !item.title ||
        !item.description ||
        !CATEGORIES.includes(item.category) ||
        !["high", "medium", "low"].includes(item.impact) ||
        !["high", "medium", "low"].includes(item.effort)
      ) {
        throw new Error("Gemini returned a recommendation with invalid fields.");
      }
      return {
        id: `gemini-rec-${index + 1}`,
        title: item.title,
        description: item.description,
        category: item.category,
        sourceFeedbackIds: (item.sourceFeedbackIds ?? []).filter((id) =>
          feedbackIds.has(id)
        ),
        impact: item.impact,
        effort: item.effort,
        status: "proposed",
        owner: item.owner || "Department leadership",
        department: "pharma",
      };
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[recommendations] generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate recommendations from Gemini." },
      { status: 502 }
    );
  }
}
