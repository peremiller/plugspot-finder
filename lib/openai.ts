const OPENAI_API_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5.6-terra";
const REQUEST_TIMEOUT_MS = 25_000;

export class OpenAIConfigurationError extends Error {
  constructor() {
    super("OpenAI features are not configured yet.");
    this.name = "OpenAIConfigurationError";
  }
}

export class OpenAIRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OpenAIRequestError";
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getBinding("OPENAI_API_KEY"));
}

export function getOpenAIModel(): string {
  return getBinding("OPENAI_MODEL") ?? DEFAULT_MODEL;
}

export async function openAIRequest<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const apiKey = getBinding("OPENAI_API_KEY");
  if (!apiKey) throw new OpenAIConfigurationError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_API_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    if (!response.ok) {
      throw new OpenAIRequestError(
        payload?.error?.message ?? "The OpenAI request failed.",
        response.status,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OpenAIRequestError("The OpenAI request timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) =>
        part && typeof part === "object" &&
        typeof (part as { text?: unknown }).text === "string"
          ? [(part as { text: string }).text]
          : [],
      );
    })
    .join("\n")
    .trim();
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof OpenAIConfigurationError) {
    return Response.json(
      { error: error.message, code: "OPENAI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  if (error instanceof OpenAIRequestError) {
    const safeStatus = error.status >= 400 && error.status < 600 ? error.status : 502;
    return Response.json(
      { error: "The AI service could not complete this request.", code: "OPENAI_REQUEST_FAILED" },
      { status: safeStatus },
    );
  }
  console.error("Unexpected OpenAI route error", error);
  return Response.json(
    { error: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

export async function readJsonBody<T>(
  request: Request,
  maxBytes: number,
): Promise<T> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) throw new OpenAIRequestError("Request is too large.", 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new OpenAIRequestError("Request is too large.", 413);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new OpenAIRequestError("Request body must be valid JSON.", 400);
  }
}

function getBinding(name: string): string | undefined {
  // The Sites Worker enables `nodejs_compat`, which maps runtime environment
  // bindings into process.env while remaining compatible with local Node tests.
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
