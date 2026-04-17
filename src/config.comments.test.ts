import { describe, expect, it } from 'vitest';
import { siteConfig } from './config';

describe('siteConfig comments backend defaults', () => {
  it('默认评论后端应回退到自有 comments 子域名，而不是 workers.dev', () => {
    expect(siteConfig.comments.backendUrl).toBe('https://comments.lishang.fun');
  });
});
