import type {
    SiteConfig,
    ProfileConfig,
    LicenseConfig
} from "./types/config"

import type { FriendLink } from "./types/friend"
import { buildCommentsConfig } from "./utils/comments"

const commentsConfig = buildCommentsConfig({
    PUBLIC_SITE_URL: "https://www.lishang.fun",
    PUBLIC_COMMENTS_ENABLE: "true",
    PUBLIC_COMMENTS_ENABLED_LOCALES: "zh-cn,en",
    ...import.meta.env,
});

export const siteConfig: SiteConfig = {
    title: "MCLISHANG",
    subTitle: "随想",

    favicon: "https://q1.qlogo.cn/g?b=qq&nk=2175459750&s=640", // 网站图标，基于 /public 目录

    pageSize: 6, // 每页文章数量
    toc: {
        enable: true,
        depth: 3 // 目录最大层级，范围 1 到 4
    },
    blogNavi: {
        enable: true // 是否启用文章底部导航
    },
    comments: commentsConfig
}

export const profileConfig: ProfileConfig = {
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=2175459750&s=640", // 支持外链头像地址
    name: "mclishang",
    description: "日常记录",
    indexPage: "https://www.lishang.fun/",
    startYear: 2024,
}

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const friendLinkConfig: FriendLink[] = []
