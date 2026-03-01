import { NextResponse } from 'next/server';
import { fetchVoices } from '@/lib/services/echo';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function GET(request: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(request);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    const voices = await fetchVoices();
    return NextResponse.json(voices);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    status = 500;
    errorMessage = message;
    return NextResponse.json({ error: message }, { status });
  } finally {
    await logApiUsage({
      request,
      principal: auth.principal,
      endpoint: "/api/echo/voices",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
