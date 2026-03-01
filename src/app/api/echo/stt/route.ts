import { NextResponse } from 'next/server';
import { transcribeWithDeepgramFile, transcribeWithDeepgramUrl } from '@/lib/services/deepgram';
import { logApiUsage, requireApiPrincipal } from '@/lib/api-key-auth';

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const auth = await requireApiPrincipal(req);
  if (!auth.ok) return auth.response;

  let status = 200;
  let errorMessage: string | null = null;
  try {
    let file: FormDataEntryValue | null = null;
    let audioUrl: FormDataEntryValue | string | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      audioUrl = typeof body?.url === "string" ? body.url : null;
    } else {
      const formData = await req.formData();
      file = formData.get('file');
      audioUrl = formData.get('url');
    }

    if (!(file instanceof File) && !(typeof audioUrl === "string" && audioUrl.trim())) {
      status = 400;
      errorMessage = "Provide an audio file or URL.";
      return NextResponse.json({ error: errorMessage }, { status });
    }

    const result =
      file instanceof File
        ? await transcribeWithDeepgramFile(file)
        : await transcribeWithDeepgramUrl(String(audioUrl));

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
      endpoint: "/api/echo/stt",
      statusCode: status,
      startedAtMs,
      errorMessage,
    });
  }
}
