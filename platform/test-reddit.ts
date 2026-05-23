import { ScraperService } from './src/worker/scraper.service';

async function test() {
  const scraper = new ScraperService();
  const res = await scraper.findRssOrLinks('https://www.reddit.com/r/technews/');
  console.log(JSON.stringify(res, null, 2));
}

test();
