import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import matter from 'gray-matter';

const BLOG_CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'blog');

describe('blog slugId', () => {
  it('每篇文章目录都必须配置且只配置一个 slugId', async () => {
    const { readdir } = await import('node:fs/promises');

    const markdownFiles: string[] = [];

    async function walk(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }

        if (entry.isFile() && entry.name.endsWith('.md')) {
          markdownFiles.push(fullPath);
        }
      }
    }

    await walk(BLOG_CONTENT_ROOT);

    const slugIdByDirectory = new Map<string, Set<string>>();

    for (const filePath of markdownFiles) {
      const directory = relative(BLOG_CONTENT_ROOT, dirname(filePath));
      const content = readFileSync(filePath, 'utf-8');
      const { data } = matter(content);
      const slugId = typeof data.slugId === 'string' ? data.slugId.trim() : '';

      expect(slugId, `${directory} 下的 ${filePath} 缺少 slugId`).not.toBe('');

      if (!slugIdByDirectory.has(directory)) {
        slugIdByDirectory.set(directory, new Set<string>());
      }

      slugIdByDirectory.get(directory)?.add(slugId);
    }

    for (const [directory, slugIds] of slugIdByDirectory.entries()) {
      expect(
        slugIds.size,
        `${directory} 目录下的多语言文章必须共用同一个 slugId`
      ).toBe(1);
    }
  });
});
