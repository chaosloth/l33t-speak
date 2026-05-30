import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToGateway } from '../gateway-client';
import type { GatewayContext } from '../gateway-client';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

const context: GatewayContext = {
  app: 'vscode',
  surface: 'editor',
  fileType: 'typescript',
};

describe('sendToGateway', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct payload to gateway', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'resp-1',
        output: { text: 'Processed: Hello world', format: 'plain' },
        processing: { route: 'rules-only', latencyMs: 5, estimatedCostUsd: 0 },
      }),
    });

    const result = await sendToGateway(
      'Hello world', 'test-key', 'http://localhost:3000', context, 'en-US');

    expect(result.ok).toBe(true);
    expect(result.processedText).toBe('Processed: Hello world');
    expect(result.metadata?.route).toBe('rules-only');
    expect(result.metadata?.estimatedCostUsd).toBe(0);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/v1/process');
    expect(opts.headers.Authorization).toBe('Bearer test-key');

    const body = JSON.parse(opts.body);
    expect(body.input.text).toBe('Hello world');
    expect(body.input.source).toBe('speech');
    expect(body.input.language).toBe('en-US');
    expect(body.context.app).toBe('vscode');
    expect(body.context.surface).toBe('editor');
    expect(body.context.fileType).toBe('typescript');
  });

  it('strips trailing slash from gateway URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        id: 'resp-2', output: { text: 'test', format: 'plain' },
        processing: { route: 'rules-only', latencyMs: 1, estimatedCostUsd: 0 },
      }),
    });

    await sendToGateway('test', 'key', 'http://localhost:3000/', context, 'en');
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:3000/api/v1/process');
  });

  it('returns ok:false on 401 (invalid API key)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 401,
      json: async () => ({ error: 'Invalid API key' }),
    });

    const result = await sendToGateway('test', 'bad-key', 'http://localhost:3000', context, 'en');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid API key');
    expect(result.status).toBe(401);
    expect(result.processedText).toBe('test');
  });

  it('returns ok:false on 403 (request rejected)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 403,
      json: async () => ({ error: 'Request rejected', reason: 'insufficient_credits' }),
    });

    const result = await sendToGateway('test', 'key', 'http://localhost:3000', context, 'en');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('rejected');
    expect(result.processedText).toBe('test');
  });

  it('returns ok:false on 500 (server error)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const result = await sendToGateway('test', 'key', 'http://localhost:3000', context, 'en');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.processedText).toBe('test');
  });

  it('falls back to raw input on empty output text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        id: 'resp-empty', output: { text: '', format: 'plain' },
        processing: { route: 'rules-only', latencyMs: 1, estimatedCostUsd: 0 },
      }),
    });

    const result = await sendToGateway('hello world', 'key', 'http://localhost:3000', context, 'en');
    expect(result.ok).toBe(true);
    // Empty string is falsy, so the `|| text` fallback gives raw input
    expect(result.processedText).toBe('hello world');
  });

  it('falls back to raw input when output field is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        id: 'resp-malformed',
        processing: { route: 'rules-only', latencyMs: 1, estimatedCostUsd: 0 },
      }),
    });

    const result = await sendToGateway('hello world', 'key', 'http://localhost:3000', context, 'en');
    expect(result.ok).toBe(true);
    expect(result.processedText).toBe('hello world');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    try {
      await sendToGateway('test', 'key', 'http://localhost:9999', context, 'en');
    } catch (err: any) {
      expect(err.message).toContain('ECONNREFUSED');
    }
  });
});
