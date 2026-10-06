const MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
] as const;

export async function generateWithGemini(
  apiKey: string,
  requestBody: Record<string, unknown>
) {
  const failures: string[] = [];
  const deadline = Date.now() + 45_000;

  for (const model of MODEL_FALLBACKS) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(Math.min(20_000, remainingMs)),
        }
      );

      if (response.ok) return await response.json();

      const details = await response.text();
      if ([400, 401, 403].includes(response.status)) {
        throw new Error(`Gemini API returned ${response.status}: ${details}`);
      }
      failures.push(`${model} (${response.status})`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Gemini API returned ")
      ) {
        throw error;
      }
      failures.push(`${model} (network/timeout)`);
    }
  }

  throw new Error(`Gemini models unavailable: ${failures.join(", ")}`);
}
