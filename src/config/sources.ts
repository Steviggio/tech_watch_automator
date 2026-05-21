export const RSS_SOURCES = [
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
