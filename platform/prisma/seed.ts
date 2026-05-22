import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      customPromptRefinement: 'Fais des résumés sous forme de liste à puces.',
    },
  });

  // 2. Create Feeds
  const feed1 = await prisma.feed.upsert({
    where: { url: 'https://nextjs.org/feed.xml' },
    update: {},
    create: {
      url: 'https://nextjs.org/feed.xml',
      title: 'Next.js Blog',
      websiteUrl: 'https://nextjs.org',
    },
  });

  const feed2 = await prisma.feed.upsert({
    where: { url: 'https://devblogs.microsoft.com/typescript/feed/' },
    update: {},
    create: {
      url: 'https://devblogs.microsoft.com/typescript/feed/',
      title: 'TypeScript Blog',
      websiteUrl: 'https://www.typescriptlang.org',
    },
  });

  // Subscribe User to Feeds
  await prisma.subscription.upsert({
    where: { userId_feedId: { userId: user.id, feedId: feed1.id } },
    update: {},
    create: { userId: user.id, feedId: feed1.id },
  });

  // 3. Create Articles
  const article1 = await prisma.article.upsert({
    where: { url: 'https://nextjs.org/blog/react-19' },
    update: {},
    create: {
      feedId: feed1.id,
      title: 'React 19 RC is Now Available',
      url: 'https://nextjs.org/blog/react-19',
      publishDate: new Date(),
      rawContent: '<p>React 19 introduces Server Components natively...</p>',
    },
  });

  const article2 = await prisma.article.upsert({
    where: { url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-6' },
    update: {},
    create: {
      feedId: feed2.id,
      title: 'Announcing TypeScript 6.0',
      url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-6',
      publishDate: new Date(Date.now() - 86400000), // Hier
      rawContent: '<p>TypeScript 6 brings massive performance boosts...</p>',
    },
  });

  // 4. Create AiSummary for Article 1 (Mocked AI response to show caching in action)
  await prisma.aiSummary.create({
    data: {
      articleId: article1.id,
      settingsHash: 'fake_hash_123',
      content: '• React 19 est là en RC.\n• Support natif des Server Components.\n• Améliorations de performance massives.',
      tags: JSON.stringify(["Frontend", "React 19"]),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
