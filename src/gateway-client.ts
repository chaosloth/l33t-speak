export interface GatewayContext {
  app: string;
  surface: 'editor' | 'terminal' | 'chat' | 'commit';
  fileType?: string;
  selectedText?: string;
  workspaceHints?: string[];
  cursorBefore?: string;
  cursorAfter?: string;
}

export interface GatewayResult {
  ok: boolean;
  processedText: string;
  status: number;
  metadata?: {
    route: string;
    model?: string;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  error?: string;
}

export async function sendToGateway(
  text: string,
  apiKey: string,
  gatewayUrl: string,
  context: GatewayContext,
  language: string,
  mode: string = 'auto',
): Promise<GatewayResult> {
  const url = `${gatewayUrl.replace(/\/$/, '')}/api/v1/process`;

  const payload = {
    input: {
      text,
      source: 'speech',
      language,
    },
    context: {
      app: context.app,
      surface: context.surface,
      fileType: context.fileType,
      selectedText: context.selectedText,
      workspaceHints: context.workspaceHints,
      cursorBefore: context.cursorBefore,
      cursorAfter: context.cursorAfter,
    },
    intent: {
      mode,
    },
    options: {
      stream: false,
      privacyMode: 'standard',
      allowTrainingCapture: false,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      processedText: text,
      status: res.status,
      error: body.error || body.message || `Gateway returned ${res.status}`,
    };
  }

  return {
    ok: true,
    processedText: body.output?.text || text,
    status: res.status,
    metadata: {
      route: body.processing?.route,
      model: body.processing?.model,
      latencyMs: body.processing?.latencyMs,
      estimatedCostUsd: body.processing?.estimatedCostUsd,
    },
  };
}
