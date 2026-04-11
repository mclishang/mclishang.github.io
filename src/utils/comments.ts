export interface CommentItemData {
  id: number | string;
  author: string;
  url: string | null;
  avatar: string;
  contentText: string;
  contentHtml: string;
  pubDate: string;
  parentId: number | string | null;
  isOwner: boolean;
  replies: CommentItemData[];
}

export interface CommentsPagination {
  page: number;
  limit: number;
  totalPage: number;
  hasMore: boolean;
}

export interface CommentsConfig {
  enable: boolean;
  backendUrl: string;
  pageSize: number;
  enabledLocales: string[];
  allowedOrigin: string;
}

type EnvValue = string | undefined;
type PublicEnv = Record<string, EnvValue>;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function parseBoolean(value: EnvValue, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

function normalizeUrl(value: EnvValue): string {
  if (!value) return '';

  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function parsePageSize(value: EnvValue): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE);
}

function parseLocales(value: EnvValue): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferCommentsBackendUrl(siteUrl: string): string {
  if (!siteUrl) return '';

  try {
    const url = new URL(siteUrl);
    const host = url.hostname.replace(/^www\./, '');
    return `https://comments.${host}`;
  } catch {
    return '';
  }
}

function getStringField<T extends Record<string, unknown>>(
  payload: T,
  keys: string[],
  fallback = ''
): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return fallback;
}

function getNullableField<T extends Record<string, unknown>>(
  payload: T,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return null;
}

function getArrayField<T extends Record<string, unknown>>(
  payload: T,
  keys: string[]
): unknown[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getBooleanField<T extends Record<string, unknown>>(
  payload: T,
  keys: string[]
): boolean {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
}

export function buildCommentsConfig(env: PublicEnv): CommentsConfig {
  const allowedOrigin = normalizeUrl(env.PUBLIC_SITE_URL);
  const backendUrl =
    normalizeUrl(env.PUBLIC_COMMENTS_BACKEND_URL) ||
    inferCommentsBackendUrl(allowedOrigin);
  const enable = parseBoolean(
    env.PUBLIC_COMMENTS_ENABLE,
    Boolean(backendUrl)
  );

  return {
    enable: enable && Boolean(backendUrl),
    backendUrl,
    pageSize: parsePageSize(env.PUBLIC_COMMENTS_PAGE_SIZE),
    enabledLocales: parseLocales(env.PUBLIC_COMMENTS_ENABLED_LOCALES),
    allowedOrigin,
  };
}

function normalizeCommentItem(input: Record<string, unknown>): CommentItemData {
  return {
    id: input.id as number | string,
    author: getStringField(input, ['author'], '匿名用户'),
    url: getNullableField(input, ['url']),
    avatar: getStringField(input, ['avatar', 'avatar_url']),
    contentText: getStringField(input, ['contentText', 'content_text']),
    contentHtml: getStringField(input, ['contentHtml', 'content_html']),
    pubDate: getStringField(input, ['pubDate', 'pub_date']),
    parentId:
      (input.parentId as number | string | null | undefined) ??
      (input.parent_id as number | string | null | undefined) ??
      null,
    isOwner: getBooleanField(input, ['isOwner', 'is_owner']),
    replies: getArrayField(input, ['replies']).map((reply) =>
      normalizeCommentItem(reply as Record<string, unknown>)
    ),
  };
}

export function normalizeCommentsResponse(payload: Record<string, unknown>): CommentItemData[] {
  const data = (payload.data as Record<string, unknown> | undefined) ?? payload;
  const comments = getArrayField(data, ['comments']);
  return comments.map((comment) =>
    normalizeCommentItem(comment as Record<string, unknown>)
  );
}

export function getCommentsPagination(
  pagination: Record<string, unknown> | null | undefined
): CommentsPagination {
  const page = Number(pagination?.page ?? 1) || 1;
  const limit = Number(pagination?.limit ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const totalPageValue = Number(pagination?.totalPage ?? 0);

  const totalPage =
    totalPageValue > 0
      ? totalPageValue
      : Math.max(
          1,
          Math.ceil(Number(pagination?.total ?? 0) / Math.max(limit, 1))
        );

  return {
    page,
    limit,
    totalPage,
    hasMore: page < totalPage,
  };
}

export function isCommentsLocaleEnabled(
  enabledLocales: string[],
  locale: string
): boolean {
  if (enabledLocales.length === 0) return true;
  return enabledLocales.includes(locale);
}
