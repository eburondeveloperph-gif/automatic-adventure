import { NextResponse } from 'next/server';
import { createOutboundCall } from '@/lib/services/orbit';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(req);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    const body = await req.json();
    const { assistantId, customerNumber } = body;
    if (!assistantId || !customerNumber) {
      status = 400;
      errorMessage = "assistantId and customerNumber are required";
      return NextResponse.json(
        { error: errorMessage },
        { status }
      );
    }
    const result = await createOutboundCall({ assistantId, customerNumber });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    status = 500;
    errorMessage = message;
    return NextResponse.json({ error: message }, { status });
  } finally {
    await logApiUsage({
      request: req,
      principal: auth.principal,
      endpoint: "/api/orbit/call",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
