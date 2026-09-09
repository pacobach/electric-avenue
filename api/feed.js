export default async function handler(req, res) {
  const feeds = [
    "https://energymonitor.ai/feed",
    "https://www.cleanenergywire.org/rss.xml",
    "https://www.energy-storage.news/feed/",
    "https://www.theguardian.com/environment/energy/rss"
  ];

  function extractTag(block, tag) {
    const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`).exec(block);
    if (cdata) return cdata[1].trim();
    const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
    return plain ? plain[1].trim() : "";
  }

  function decodeEntities(s) {
    return s
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  function parseItems(xml, sourceName) {
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < 4) {
      const block = m[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");
      const desc = decodeEntities(extractTag(block, "description"))
        .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 130) + "…";
      if (title && link) items.push({ title, link, pubDate, source: sourceName, desc });
    }
    return items;
  }

  try {
    const settled = await Promise.allSettled(
      feeds.map(async (url) => {
        const hostname = new URL(url).hostname;
        const nameMap = {
          "energymonitor.ai": "Energy Monitor",
          "www.cleanenergywire.org": "Clean Energy Wire",
          "www.energy-storage.news": "Energy Storage News",
          "www.theguardian.com": "The Guardian Energy"
        };
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
        const xml = await r.text();
        const channelTitle = nameMap[hostname] || hostname;
        return parseItems(xml, channelTitle);
      })
    );
    const results = settled
      .filter(r => r.status === "fulfilled")
      .map(r => r.value);
    const all = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({ items: all.slice(0, 10) });
  } catch {
    res.status(200).json({ items: [] });
  }
}
