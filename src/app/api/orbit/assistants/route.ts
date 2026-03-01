import { NextResponse } from 'next/server';
import { fetchAssistants } from '@/lib/services/orbit';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function GET(request: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(request);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    const list = await fetchAssistants();
    return NextResponse.json(Array.isArray(list) ? list : []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    status = 500;
    errorMessage = message;
    console.error('[orbit/assistants]', message);
    return NextResponse.json({ error: message }, { status });
  } finally {
    await logApiUsage({
      request,
      principal: auth.principal,
      endpoint: "/api/orbit/assistants",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
