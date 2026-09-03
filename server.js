import express from "express";
import { readdirSync, statSync, readFileSync } from "fs";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "content");
const PORT = process.env.PORT || 3000;

const app = express();

let config = {};
try {
  const raw = readFileSync(join(__dirname, "config.json"), "utf-8");
  config = JSON.parse(raw);
} catch {
  config = { siteName: "Markdownium Wiki", baseUrl: `http://localhost:${PORT}/` };
}

const siteUrl = config.baseUrl.replace(/\/$/, "");
const feedUrl = `${siteUrl}/feed.rss`;
const atomUrl = `${siteUrl}/feed.atom`;

const EXCLUDED_FILES = new Set(["sidebar.md", "top.md", "home.md"]);

function getMarkdownFiles() {
  try {
    const entries = readdirSync(CONTENT_DIR);
    const files = entries
      .filter((f) => extname(f) === ".md" && !EXCLUDED_FILES.has(f))
      .map((f) => {
        const fullPath = join(CONTENT_DIR, f);
        const stats = statSync(fullPath);
        const content = readFileSync(fullPath, "utf-8");
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : basename(f, ".md");
        const slug = basename(f, ".md");
        return {
          slug,
          title,
          pubDate: stats.mtime,
          description: content.slice(0, 200).replace(/[#*_`]/g, "").trim(),
        };
      });
    files.sort((a, b) => b.pubDate - a.pubDate);
    return files;
  } catch {
    return [];
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date) {
  return date.toUTCString();
}

app.use(express.static(__dirname));

app.get("/content/:file.md", (req, res) => {
  const filePath = join(CONTENT_DIR, `${req.params.file}.md`);
  res.sendFile(filePath, {}, (err) => {
    if (err) res.status(404).send("not found");
  });
});

app.get("/feed.rss", (_req, res) => {
  const items = getMarkdownFiles();
  const now = new Date().toUTCString();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(config.siteName)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
`;
  for (const item of items) {
    xml += `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(`${siteUrl}/#/${item.slug}`)}</link>
      <guid isPermaLink="true">${escapeXml(`${siteUrl}/#/${item.slug}`)}</guid>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>
`;
  }
  xml += `  </channel>
</rss>`;
  res.type("application/rss+xml").send(xml);
});

app.get("/feed.atom", (_req, res) => {
  const items = getMarkdownFiles();
  const now = new Date().toISOString();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(config.siteName)}</title>
  <link href="${escapeXml(siteUrl)}" />
  <link href="${escapeXml(atomUrl)}" rel="self" />
  <updated>${now}</updated>
  <id>${escapeXml(siteUrl)}</id>
`;
  for (const item of items) {
    xml += `  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(`${siteUrl}/#/${item.slug}`)}" />
    <id>${escapeXml(`${siteUrl}/#/${item.slug}`)}</id>
    <updated>${item.pubDate.toISOString()}</updated>
    <summary>${escapeXml(item.description)}</summary>
  </entry>
`;
  }
  xml += `</feed>`;
  res.type("application/atom+xml").send(xml);
});

app.listen(PORT, () => {
  console.log(`Markdownium running at http://localhost:${PORT}`);
  console.log(`RSS feed: ${feedUrl}`);
  console.log(`Atom feed: ${atomUrl}`);
});
