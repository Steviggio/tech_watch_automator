import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
  const db = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
  console.log(JSON.stringify(db.properties, null, 2));
}

main().catch(console.error);
