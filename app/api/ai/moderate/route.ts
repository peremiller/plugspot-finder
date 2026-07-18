import {
  apiErrorResponse,
  openAIRequest,
  OpenAIRequestError,
  readJsonBody,
} from "@/lib/openai";

type ModerateRequest = { text?: unknown };
type ModerationResponse = {
  results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<ModerateRequest>(request, 16_000);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return Response.json({ allowed: true });
    if (text.length > 2_000) throw new OpenAIRequestError("Report notes are too long.", 400);

    const response = await openAIRequest<ModerationResponse>("/moderations", {
      model: "omni-moderation-latest",
      input: text,
    });
    const result = response.results?.[0];
    return Response.json({
      allowed: !result?.flagged,
      categories: result?.flagged
        ? Object.entries(result.categories ?? {}).filter(([, flagged]) => flagged).map(([name]) => name)
        : [],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
