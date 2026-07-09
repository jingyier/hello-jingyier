import { getCollection } from "astro:content";

export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL("https://jingyier.pages.dev");
  const notes = (await getCollection("notes")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const items = notes
    .map((note) => {
      const link = new URL(`/notes#${note.slug}`, base).toString();
      return `<item><title><![CDATA[${note.data.title}]]></title><link>${link}</link><guid>${link}</guid><pubDate>${note.data.date.toUTCString()}</pubDate><description><![CDATA[${note.data.summary}]]></description></item>`;
    })
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>jingyier notes</title><link>${base}</link><description>Notes from jingyier.</description>${items}</channel></rss>`,
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8"
      }
    }
  );
}
