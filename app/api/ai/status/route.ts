export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { configured: false, disabled: true, capabilities: [] },
    { status: 410 },
  );
}
