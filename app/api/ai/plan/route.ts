export function POST() {
  return Response.json(
    { error: "Workspace Copilot is disabled.", code: "FEATURE_DISABLED" },
    { status: 410 },
  );
}
