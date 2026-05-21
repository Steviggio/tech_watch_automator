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
    name: "TypeScript",
    url: "https://devblogs.microsoft.com/typescript/feed/",
    category: "Language",
  },
  {
    name: "Rust",
    url: "https://blog.rust-lang.org/feed.xml",
    category: "Backend",
  },
  {
    name: "React.js",
    url: "https://react.dev/rss.xml",
    category: "Frontend",
  },
  {
    name: "Node.js",
    category: "Backend",
    url: "https://nodejs.org/en/feed/blog.xml",
  },
  {
    name: "AI/ML",
    category: "AI",
    url: "https://stackoverflow.blog/feed/",
  },
];

export const NOTION_CONFIG = {
  databaseId: process.env.NOTION_DATABASE_ID as string,
  token: process.env.NOTION_TOKEN as string,
};

export const SYNC_CONFIG = {
  maxAgeDays: 20,
};
