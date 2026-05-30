import * as vscode from 'vscode';

let channel: vscode.OutputChannel | null = null;

export function getGatewayChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('L33t Gateway');
  }
  return channel;
}

export function disposeChannel(): void {
  channel?.dispose();
  channel = null;
}

export function logGatewayRequest(text: string, url: string): void {
  const ch = getGatewayChannel();
  ch.appendLine(`[${new Date().toISOString()}] POST ${url}`);
  ch.appendLine(`  Raw text (${text.length} chars): "${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"`);
}

export function logGatewayResponse(result: {
  ok: boolean;
  status: number;
  processedText: string;
  metadata?: { route?: string; model?: string; latencyMs?: number; estimatedCostUsd?: number };
  error?: string;
}): void {
  const ch = getGatewayChannel();
  ch.appendLine(`  Status: ${result.status}`);
  if (result.ok) {
    ch.appendLine(`  Route: ${result.metadata?.route || 'unknown'}`);
    ch.appendLine(`  Model: ${result.metadata?.model || 'unknown'}`);
    ch.appendLine(`  Latency: ${result.metadata?.latencyMs ?? '?'}ms`);
    ch.appendLine(`  Cost: $${(result.metadata?.estimatedCostUsd ?? 0).toFixed(6)}`);
    ch.appendLine(`  Processed (${result.processedText.length} chars): "${result.processedText.slice(0, 200)}${result.processedText.length > 200 ? '...' : ''}"`);
  } else {
    ch.appendLine(`  Error: ${result.error || 'unknown'}`);
  }
  ch.appendLine('');
}

export function logGatewayError(message: string): void {
  const ch = getGatewayChannel();
  ch.appendLine(`[${new Date().toISOString()}] ERROR: ${message}`);
  ch.appendLine('');
}

export function logGatewayInfo(message: string): void {
  const ch = getGatewayChannel();
  ch.appendLine(`[${new Date().toISOString()}] ${message}`);
}
