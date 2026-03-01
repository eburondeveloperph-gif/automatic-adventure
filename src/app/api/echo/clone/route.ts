import { NextResponse } from 'next/server';
import { cloneVoice } from '@/lib/services/echo';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(req);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];
    const labelsRaw = formData.get('labels') as string;
    const labels = labelsRaw ? JSON.parse(labelsRaw) : {};

    if (!name || files.length === 0) {
      status = 400;
      errorMessage = "Name and files are required";
      return NextResponse.json({ error: errorMessage }, { status });
    }

    const result = await cloneVoice(name, description, files, labels);
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
      endpoint: "/api/echo/clone",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
