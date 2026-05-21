export interface RssSource {
  name: string;
  url: string;
  category: string;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  categoryMapping?: Record<string, string>;
}

export const RSS_SOURCES: RssSource[] = [
  { name: "Next.js", url: "https://nextjs.org/feed.xml", category: "Frontend" },
  {
    name: "NestJS",
    url: "https://trilon.io/blog/rss.xml",
    category: "Backend",
  },
  {
    name: "TypeScript",
    url: "https://devblogs.microsoft.com/typescript/feed/",
    category: "Language",
  },
  {
    name: "Rust",
    url: "https://blog.rust-lang.org/feed.xml",
    category: "Language",
  },
];

export const NOTION_CONFIG = {
  databaseId: process.env.NOTION_DATABASE_ID as string,
  token: process.env.NOTION_TOKEN as string,
};

export const SYNC_CONFIG = {
  maxAgeDays: 7, // On ne garde que les articles des 7 derniers jours
};
