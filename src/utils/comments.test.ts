import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildCommentsConfig,
  getCommentsPagination,
  normalizeOwnerMetaResponse,
  normalizeCommentsResponse,
  shouldShowOwnerKeyInput,
} from './comments';

describe('normalizeCommentsResponse', () => {
  it('归一化 Momo-Backend 的嵌套评论响应', () => {
    const result = normalizeCommentsResponse({
      data: {
        comments: [
          {
            id: 1,
            author: 'Alice',
            url: 'https://example.com',
            avatar: 'https://example.com/avatar.png',
            content_text: '你好',
            content_html: '<p>你好</p>',
            pub_date: '2026-04-11T12:00:00Z',
            replies: [
              {
                id: 2,
                author: 'Bob',
                avatar_url: 'https://example.com/bob.png',
                contentText: '收到',
                contentHtml: '<p>收到</p>',
                pubDate: '2026-04-11T12:30:00Z',
                parent_id: 1,
                replies: [],
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 21,
        },
      },
    });

    expect(result).toEqual([
      {
        id: 1,
        author: 'Alice',
        url: 'https://example.com',
        avatar: 'https://example.com/avatar.png',
        contentText: '你好',
        contentHtml: '<p>你好</p>',
        pubDate: '2026-04-11T12:00:00Z',
        parentId: null,
        isOwner: false,
        replies: [
          {
            id: 2,
            author: 'Bob',
            url: null,
            avatar: 'https://example.com/bob.png',
            contentText: '收到',
            contentHtml: '<p>收到</p>',
            pubDate: '2026-04-11T12:30:00Z',
            parentId: 1,
            isOwner: false,
            replies: [],
          },
        ],
      },
    ]);
  });

  it('保留评论接口返回的本人标记', () => {
    const result = normalizeCommentsResponse({
      data: {
        comments: [
          {
            id: 1,
            author: 'Owner',
            avatar: 'https://example.com/avatar.png',
            content_text: '你好',
            content_html: '<p>你好</p>',
            pub_date: '2026-04-11T12:00:00Z',
            is_owner: true,
            replies: [
              {
                id: 2,
                author: 'Guest',
                avatar_url: 'https://example.com/guest.png',
                contentText: '收到',
                contentHtml: '<p>收到</p>',
                pubDate: '2026-04-11T12:30:00Z',
                parent_id: 1,
                isOwner: false,
                replies: [],
              },
            ],
          },
        ],
      },
    });

    expect(result[0]?.isOwner).toBe(true);
    expect(result[0]?.replies[0]?.isOwner).toBe(false);
  });
});

describe('getCommentsPagination', () => {
  it('兼容 totalPage 与 total 两种分页字段', () => {
    expect(
      getCommentsPagination({
        page: 1,
        limit: 20,
        totalPage: 3,
      })
    ).toEqual({ page: 1, limit: 20, totalPage: 3, hasMore: true });

    expect(
      getCommentsPagination({
        page: 2,
        limit: 20,
        total: 35,
      })
    ).toEqual({ page: 2, limit: 20, totalPage: 2, hasMore: false });
  });
});

describe('buildCommentsConfig', () => {
  it('从环境变量构建评论配置并清理地址格式', () => {
    const result = buildCommentsConfig({
      PUBLIC_SITE_URL: 'https://www.lishang.fun',
      PUBLIC_COMMENTS_ENABLE: 'true',
      PUBLIC_COMMENTS_BACKEND_URL: 'https://comments.lishang.fun/',
      PUBLIC_COMMENTS_PAGE_SIZE: '50',
      PUBLIC_COMMENTS_ENABLED_LOCALES: 'zh-cn,en',
    });

    expect(result).toEqual({
      enable: true,
      backendUrl: 'https://comments.lishang.fun',
      pageSize: 50,
      enabledLocales: ['zh-cn', 'en'],
      allowedOrigin: 'https://www.lishang.fun',
      ownerName: '',
    });
  });
});

describe('normalizeOwnerMetaResponse', () => {
  it('从后端公开接口中提取站长昵称', () => {
    expect(
      normalizeOwnerMetaResponse({
        code: 200,
        data: {
          ownerName: '一只殇',
        },
      })
    ).toBe('一只殇');

    expect(
      normalizeOwnerMetaResponse({
        owner_name: '一只殇',
      })
    ).toBe('一只殇');
  });

  it('在未配置站长昵称时返回空字符串', () => {
    expect(normalizeOwnerMetaResponse({})).toBe('');
    expect(normalizeOwnerMetaResponse({ data: {} })).toBe('');
  });
});

describe('shouldShowOwnerKeyInput', () => {
  it('只有昵称命中站长昵称时才显示密钥输入框', () => {
    expect(shouldShowOwnerKeyInput('一只殇', '一只殇')).toBe(true);
    expect(shouldShowOwnerKeyInput(' 一只殇 ', '一只殇')).toBe(true);
    expect(shouldShowOwnerKeyInput('普通读者', '一只殇')).toBe(false);
    expect(shouldShowOwnerKeyInput('一只殇', '')).toBe(false);
    expect(shouldShowOwnerKeyInput('', '一只殇')).toBe(false);
  });
});

describe('Comments.svelte', () => {
  it('不应把响应式语句残留到模板正文中', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/comment/Comments.svelte'),
      'utf8'
    );

    expect(source.trimEnd()).not.toMatch(
      /<\/div>\s*\$: showOwnerKeyInput = shouldShowOwnerKeyInput\(author, ownerName\);$/
    );
  });
});
