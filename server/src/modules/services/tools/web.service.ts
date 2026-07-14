import FirecrawlApp from "@mendable/firecrawl-js";

let firecrawl: FirecrawlApp | null = null;

function getClient(): FirecrawlApp {
  if (!firecrawl) {
    firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY || "",
    });
  }
  return firecrawl;
}

export async function webSearch(query: string, limit = 5) {
  try {
    const client = getClient();
    const response = await client.search(query, { limit });
    const results = (response as any)?.data ?? [];
    return results.map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (error) {
    console.error("Web search failed:", error);
    return [];
  }
}

export async function webFetch(url: string) {
  try {
    const client = getClient();
    const response = await client.scrapeUrl(url);
    return (response as any)?.data ?? null;
  } catch (error) {
    console.error("Web fetch failed:", error);
    return null;
  }
}
