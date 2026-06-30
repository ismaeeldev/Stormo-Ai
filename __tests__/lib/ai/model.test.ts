import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('getModel()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('best: returns ChatAnthropic when AI_PROVIDER=anthropic and key is set', async () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key');
    vi.stubEnv('AI_MODEL', 'claude-sonnet-4-5-20250929');
    const { getModel } = await import('@/lib/ai/model');
    const model = getModel();
    expect(model.constructor.name).toBe('ChatAnthropic');
  });

  it('worst: throws when anthropic key is missing', async () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { getModel } = await import('@/lib/ai/model');
    expect(() => getModel()).toThrow('ANTHROPIC_API_KEY environment variable is not set');
  });

  it('worst: throws on unsupported provider', async () => {
    vi.stubEnv('AI_PROVIDER', 'cohere');
    vi.stubEnv('ANTHROPIC_API_KEY', 'key');
    const { getModel } = await import('@/lib/ai/model');
    expect(() => getModel()).toThrow('Unsupported AI provider: cohere');
  });
});

describe('getEmbeddingModel()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('best: returns real OpenAIEmbeddings when key is valid', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-real-key');
    const { getEmbeddingModel } = await import('@/lib/ai/model');
    const model = getEmbeddingModel();
    expect(model.constructor.name).toBe('OpenAIEmbeddings');
  });

  it('avg: falls back to MockEmbeddings when key is placeholder', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'YOUR_VALUE_HERE');
    const { getEmbeddingModel } = await import('@/lib/ai/model');
    const model = getEmbeddingModel();
    // MockEmbeddings is cast as OpenAIEmbeddings — check it works
    const embedding = await model.embedQuery('test');
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
  });

  it('worst: MockEmbeddings returns 1536-dim vector when key is empty', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { getEmbeddingModel } = await import('@/lib/ai/model');
    const model = getEmbeddingModel();
    const embedding = await model.embedQuery('some text');
    expect(embedding.length).toBe(1536);
    embedding.forEach((v: number) => expect(typeof v).toBe('number'));
  });

  it('avg: MockEmbeddings embedDocuments returns array of arrays', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { getEmbeddingModel } = await import('@/lib/ai/model');
    const model = getEmbeddingModel() as any;
    const results = await model.embedDocuments(['text 1', 'text 2']);
    expect(results.length).toBe(2);
    results.forEach((r: number[]) => expect(r.length).toBe(1536));
  });
});
