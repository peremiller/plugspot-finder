import { isOpenAIConfigured } from "@/lib/openai";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    configured: isOpenAIConfigured(),
    capabilities: ["workspace-planning", "photo-verification", "report-moderation"],
  });
}
