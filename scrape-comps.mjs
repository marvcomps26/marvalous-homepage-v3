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
    const links = Array.from(
      document.querySelectorAll('a[href*="/competition/"]')
    );

    const seen = new Set();
    const results = [];

    for (const link of links) {
      const url = link.href;

      if (!url || seen.has(url)) continue;

      const card =
        link.closest("article") ||
        link.closest(".swiper-slide") ||
        link.closest("[class*='rounded']") ||
        link.parentElement;

      if (!card) continue;

      const text = (card.innerText || "")
        .replace(/\s+/g, " ")
        .trim();

      const soldMatch = text.match(
        /(\d[\d,]*)\s*\/\s*(\d[\d,]*)/
      );

      if (!soldMatch) continue;

      const image =
        card.querySelector("img")?.src ||
        link.querySelector("img")?.src ||
        "";

      const percentMatch = text.match(
        /(\d+(?:\.\d+)?)%\s*Sold/i
      );

      const priceMatch = text.match(
        /£\s*(\d+(?:\.\d+)?)\s*(?:Per Ticket|Ticket)?/i
      );

      const instantWinsMatch = text.match(
        /Instant Wins?\s*(\d[\d,]*)/i
      );

      const titleElement = card.querySelector("h1,h2,h3,h4");
      const title =
        titleElement?.textContent?.replace(/\s+/g, " ").trim() ||
        link.getAttribute("aria-label") ||
        "Competition";

      const ticketsSold = Number(
        soldMatch[1].replace(/,/g, "")
      );

      const totalTickets = Number(
        soldMatch[2].replace(/,/g, "")
      );
      seen.add(url);
      results.push({
        title,
        url,
        image,
        ticketsSold,
        totalTickets,
        percentSold: percentMatch
          ? Number(percentMatch[1])
          : Number(
              ((ticketsSold / totalTickets) * 100).toFixed(2)
            ),
        ticketPrice: priceMatch
          ? Number(priceMatch[1])
          : null,
        instantWins: instantWinsMatch
          ? Number(
              instantWinsMatch[1].replace(/,/g, "")
            )
          : null
      });
    }

    return results;
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
