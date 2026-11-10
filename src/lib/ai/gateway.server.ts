// Server-only helper for Lovable AI Gateway structured generation.
// Never import this file from client code; import the server functions in ai.functions.ts instead.
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod/v4";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export class AiGenerationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return response;
  };
}

function toAiError(error: unknown): AiGenerationError {
  if (error instanceof AiGenerationError) return error;
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 500;
    let message = "The AI service could not complete this request.";
    try {
      const body = error.responseBody ? JSON.parse(error.responseBody) : null;
      const safe = body?.message ?? body?.error?.message;
      if (typeof safe === "string" && safe.length < 400) message = safe;
    } catch {
      // keep generic message
    }
    if (status === 429) message = "Too many requests right now. Please wait a moment and try again.";
    if (status === 402 && !message.toLowerCase().includes("credit"))
      message = "AI credits are used up for this workspace. Add credits to keep generating.";
    return new AiGenerationError(message, status);
  }
  if (NoObjectGeneratedError.isInstance(error)) {
    return new AiGenerationError("The AI returned an incomplete result. Please try again.", 502);
  }
  return new AiGenerationError("The AI service could not complete this request.", 500);
}

export async function generateStructured<T>(options: {
  schema: z.ZodType<T>;
  instructions: string;
  prompt: string;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGenerationError("AI writing is not configured for this app yet.", 401);

  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });

  let streamError: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    instructions: options.instructions,
    messages: [{ role: "user", content: options.prompt }],
    output: Output.object({ schema: options.schema }),
    maxRetries: 0,
    onError: ({ error }: { error: unknown }) => {
      streamError ??= error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    const output = await result.output;
    if (output == null) throw streamError ?? new AiGenerationError("Empty AI response.", 502);
    return output as T;
  } catch (error) {
    throw toAiError(streamError ?? error);
  }
}
