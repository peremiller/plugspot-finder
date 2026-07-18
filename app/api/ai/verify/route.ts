import {
  apiErrorResponse,
  extractResponseText,
  getOpenAIModel,
  openAIRequest,
  OpenAIRequestError,
  readJsonBody,
} from "@/lib/openai";

type VerifyRequest = { image?: unknown; placeName?: unknown };
const DATA_IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<VerifyRequest>(request, 7_500_000);
    const image = typeof body.image === "string" ? body.image : "";
    const placeName = typeof body.placeName === "string" ? body.placeName.trim().slice(0, 100) : "this place";
    if (!DATA_IMAGE.test(image)) {
      throw new OpenAIRequestError("Upload a JPEG, PNG, or WebP image.", 400);
    }

    const response = await openAIRequest<unknown>("/responses", {
      model: getOpenAIModel(),
      instructions:
        "Inspect workspace photos conservatively. Report only what is visibly supported. Do not infer outlet functionality, Wi-Fi speed, ownership, safety certification, or opening hours from an image. Flag uncertainty clearly.",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: `Review this community photo for ${placeName}. Check visible electrical outlets, usable seating, and workspace suitability.` },
          { type: "input_image", image_url: image, detail: "low" },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "workspace_photo_check",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              verdict: { type: "string", enum: ["useful", "unclear", "not_relevant"] },
              outletsVisible: { type: "integer", minimum: 0 },
              seatingVisible: { type: "boolean" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              note: { type: "string" },
            },
            required: ["verdict", "outletsVisible", "seatingVisible", "confidence", "note"],
          },
        },
      },
    });
    return Response.json({ verification: JSON.parse(extractResponseText(response)) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
