import { describe, it, expect } from 'vitest';

// Test the JSON parsing logic extracted from action-generator.ts
// The generator does: text.replace(/```json/g,'').replace(/```/g,'').trim() then JSON.parse

function parseActionJson(rawText: string) {
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

const VALID_ACTION = {
  title: 'Reddit Community Post',
  description: 'Post a helpful tip in r/shopify about reducing cart abandonment.',
  content: 'Hey r/shopify — here is what helped us cut cart abandonment by 30%...',
  channel: 'reddit',
  action_type: 'community',
};

describe('Action JSON parsing (action-generator)', () => {
  it('best: parses clean JSON string directly', () => {
    const result = parseActionJson(JSON.stringify(VALID_ACTION));
    expect(result.title).toBe(VALID_ACTION.title);
    expect(result.channel).toBe('reddit');
    expect(result.action_type).toBe('community');
  });

  it('avg: parses JSON wrapped in ```json fences', () => {
    const text = `\`\`\`json\n${JSON.stringify(VALID_ACTION)}\n\`\`\``;
    const result = parseActionJson(text);
    expect(result.title).toBe(VALID_ACTION.title);
  });

  it('avg: parses JSON wrapped in plain ``` fences', () => {
    const text = `\`\`\`\n${JSON.stringify(VALID_ACTION)}\n\`\`\``;
    const result = parseActionJson(text);
    expect(result.channel).toBe('reddit');
  });

  it('avg: parses JSON with leading/trailing whitespace', () => {
    const text = `   \n  ${JSON.stringify(VALID_ACTION)}  \n   `;
    const result = parseActionJson(text);
    expect(result.action_type).toBe('community');
  });

  it('worst: throws SyntaxError on invalid JSON', () => {
    expect(() => parseActionJson('not json at all')).toThrow(SyntaxError);
  });

  it('worst: throws on empty string', () => {
    expect(() => parseActionJson('')).toThrow();
  });

  it('worst: throws on partial JSON', () => {
    expect(() => parseActionJson('{"title": "Incomplete')).toThrow();
  });

  it('best: all required fields present in valid response', () => {
    const result = parseActionJson(JSON.stringify(VALID_ACTION));
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('channel');
    expect(result).toHaveProperty('action_type');
  });

  it('avg: extra fields in response are preserved', () => {
    const withExtra = { ...VALID_ACTION, extra_field: 'ignored' };
    const result = parseActionJson(JSON.stringify(withExtra));
    expect(result.extra_field).toBe('ignored');
    expect(result.title).toBe(VALID_ACTION.title);
  });
});
