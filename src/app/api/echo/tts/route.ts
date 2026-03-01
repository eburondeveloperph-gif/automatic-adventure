import { NextResponse } from 'next/server';
import { generateTTS } from '@/lib/services/echo';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(req);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    const { voiceId, text, modelId, outputFormat } = await req.json();
    if (!voiceId || !text || !modelId || !outputFormat) {
      status = 400;
      errorMessage = "voiceId, text, modelId, and outputFormat are required";
      return NextResponse.json({ error: errorMessage }, { status });
    }
    const blob = await generateTTS(voiceId, text, modelId, outputFormat);
    return new Response(blob, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    status = 500;
    errorMessage = message;
    return NextResponse.json({ error: message }, { status });
  } finally {
    await logApiUsage({
      request: req,
      principal: auth.principal,
      endpoint: "/api/echo/tts",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
