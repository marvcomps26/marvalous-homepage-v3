import { chromium } from "playwright";
import fs from "node:fs/promises";

const WEBSITE_URL = "https://marvalouscompetitions.co.uk/";

const browser = await chromium.launch({
  headless: true
});

try {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    viewport: {
      width: 1440,
      height: 1400
    }
  });

  await page.goto(WEBSITE_URL, {
  waitUntil: "domcontentloaded",
  timeout: 60000
});

await page.waitForSelector('a[href*="/competition/"]', {
  timeout: 30000
});

await page.waitForTimeout(3000);

  const pageTitle = await page.title();
  const bodyText = await page.locator("body").innerText();

  if (
    pageTitle.toLowerCase().includes("access blocked") ||
    bodyText.toLowerCase().includes("access blocked")
  ) {
    throw new Error("Website returned the Access Blocked page.");
  }

const competitions = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll(".swiper-slide"));

  const competitions = [];

  for (const card of cards) {
    const link = card.querySelector('a[href*="/competition/"]');
    if (!link) continue;

    const text = (card.innerText || "").replace(/\s+/g, " ");

    const soldMatch = text.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
    if (!soldMatch) continue;

    const percentMatch = text.match(/(\d+(?:\.\d+)?)%\s*Sold/i);

    const instantWinsMatch = text.match(/Instant Wins?\s*([\d,]+)/i);

    const priceMatch =
      text.match(/£\s*(\d+(?:\.\d+)?)\s*Per Ticket/i) ||
      text.match(/(\d+(?:\.\d+)?)p\s*Per Ticket/i);

    const title =
      card.querySelector("p.font-display")?.textContent?.trim() ||
      card.querySelector("h1,h2,h3,h4")?.textContent?.trim() ||
      "Competition";

    competitions.push({
      title,
      url: link.href,
      image: card.querySelector("img")?.src || "",
      ticketsSold: Number(soldMatch[1].replace(/,/g, "")),
      totalTickets: Number(soldMatch[2].replace(/,/g, "")),
      percentSold: percentMatch ? Number(percentMatch[1]) : 0,
      ticketPrice: priceMatch
        ? (priceMatch[0].includes("p")
            ? Number(priceMatch[1]) / 100
            : Number(priceMatch[1]))
        : null,
      instantWins: instantWinsMatch
        ? Number(instantWinsMatch[1].replace(/,/g, ""))
        : null
    });
  }

  return competitions;
});
    
    

    
  if (!competitions.length) {
    throw new Error("No live competitions were found.");
  }

  const output = {
    updatedAt: new Date().toISOString(),
    count: competitions.length,
    competitions
  };

  await fs.writeFile(
    "live-comps.json",
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log(`Saved ${competitions.length} competitions.`);
} finally {
  await browser.close();
}
