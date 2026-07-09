import { getCollection } from "astro:content";

export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL("https://jingyier.pages.dev");
  const works = await getCollection("work");
  const notes = await getCollection("notes");
  const staticPages = ["", "work", "notes", "about"];
  const urls = [
    ...staticPages.map((path) => new URL(`/${path}`, base).toString()),
    ...works.map((work) => new URL(`/work#${work.slug}`, base).toString()),
    ...notes.map((note) => new URL(`/notes#${note.slug}`, base).toString())
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join("")}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8"
      }
    }
  );
}
