# 博客评论接入说明

本文档说明当前博客如何对接 `Momo-Backend` 的 Cloudflare Worker 版本。

## 博客侧配置

评论配置位于 [src/config.ts](/F:/DEV/web/Blog/src/config.ts:1)，当前默认后端地址已经指向：

- `https://momo-backend-worker.lishang778.workers.dev`

由以下公开环境变量驱动：

- `PUBLIC_SITE_URL`：博客站点地址，例如 `https://www.lishang.fun`
- `PUBLIC_COMMENTS_ENABLE`：是否启用评论，支持 `true` / `false`
- `PUBLIC_COMMENTS_BACKEND_URL`：评论后端地址，例如 `https://comments.lishang.fun`
- `PUBLIC_COMMENTS_PAGE_SIZE`：评论分页大小，默认 `20`，最大 `50`
- `PUBLIC_COMMENTS_ENABLED_LOCALES`：允许显示评论的语言列表，使用逗号分隔，例如 `zh-cn,en`

如果没有显式设置 `PUBLIC_COMMENTS_BACKEND_URL`，前端会尝试根据 `PUBLIC_SITE_URL` 推断为 `https://comments.<主域名>`。

## Momo-Backend Worker 部署

参考上游文档：

- Worker 部署说明：<https://github.com/Motues/Momo-Backend/blob/main/worker/README.md>
- API 文档：<https://github.com/Motues/Momo-Backend/blob/main/doc/api.md>

当前实际部署结果：

- Worker 名称：`momo-backend-worker`
- workers.dev 地址：`https://momo-backend-worker.lishang778.workers.dev`
- D1 数据库：`MOMO_DB`
- KV 命名空间：`MOMO_AUTH_KV`

推荐部署步骤：

1. 在 Cloudflare Workers 中部署 `Momo-Backend/worker`
2. 创建并绑定 `MOMO_DB` 的 D1 数据库
3. 创建并绑定 `MOMO_AUTH_KV` 的 KV 命名空间
4. 设置 `ALLOW_ORIGIN` 为博客正式域名，例如 `https://www.lishang.fun`
5. 设置管理员账号和密码
6. 为 Worker 绑定正式子域名，例如 `comments.lishang.fun`

当前账号下未发现 `lishang.fun` 的 Cloudflare Zone，因此本次实际可用地址先落在 `workers.dev`。如果后续把域名托管到同一个 Cloudflare 账号，再把 `PUBLIC_COMMENTS_BACKEND_URL` 切到正式子域名即可。

## 直接发布策略

当前博客前端按“评论提交后直接显示”设计接入。

如果你的 Worker 环境默认仍然要求审核，请在后端配置或初始化逻辑中显式改成自动通过；否则前端会提示提交成功，但公开接口不会立即返回新评论。

## 内容约束

每篇博客文章都必须配置 `slugId`，并且同一篇文章的多语言版本必须共用同一个 `slugId`。项目测试会校验这条规则。
