import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const checks = [];

const read = (path) => readFileSync(join(dist, path), "utf8");

const assert = (name, passed, detail = "") => {
  checks.push({ name, passed, detail });
};

const existsInDist = (path) => existsSync(join(dist, path.replace(/^\//, "")));

const index = read("index.html");
const about = read("about/index.html");
const garden = read("garden/index.html");
const notes = read("notes/index.html");
const work = read("work/index.html");
const homeScript = readFileSync(join(root, "src/scripts/home.js"), "utf8");
const homeData = JSON.parse(readFileSync(join(root, "src/content/home.json"), "utf8"));
const servicePlan = readFileSync(join(root, "docs/service-readiness-plan.md"), "utf8");
const cloudflareNotes = readFileSync(join(root, "docs/cloudflare-pages.md"), "utf8");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

assert("core pages are generated", Boolean(index && about && garden && notes && work));
assert("home-data JSON is present", index.includes('id="home-data"'));
assert("home links do not contain #undefined", !index.includes("#undefined"));
assert("home page does not include garden app shell", !index.includes("garden-app") && !index.includes("phone-frame"));
assert("home content has expanded static pools", homeData.quotes.length >= 8 && homeData.weatherNotes.length >= 5 && homeData.messages.length >= 5);
assert("home script reads embedded JSON with fallback defaults", homeScript.includes("querySelector(\"#home-data\")") && homeScript.includes("return defaults"));
assert("home script updates HH:mm:ss clocks", homeScript.includes("second: \"2-digit\"") && homeScript.includes("window.setInterval(updateClock, 1000)"));
assert("home script cycles quotes and weather/status pools", homeScript.includes("state.quoteIndex = (state.quoteIndex + 1) % quotes.length") && homeScript.includes("state.weatherIndex = (state.weatherIndex + 1) % weatherNotes.length"));
assert("home script supports local-only message controls", homeScript.includes("data-undo-message") && homeScript.includes("data-clear-messages") && homeScript.includes("state.messages.pop()"));
assert("home script persists browser-only state and falls back safely", homeScript.includes("window.localStorage") && homeScript.includes("storageEnabled") && homeScript.includes("刷新页面后不会保留"));
assert("home copy does not promise public visitor collection", index.includes("留言只保存在你的浏览器里") && !index.includes("公开留言"));
assert("garden route keeps app marker", garden.includes("data-garden-app"));
assert("garden route keeps chapter controls", garden.includes("data-step") && garden.includes("data-reset") && garden.includes("data-finish"));
assert("garden route keeps image fallback metadata", garden.includes("data-fallback-src"));

const fallbackPaths = [...garden.matchAll(/data-fallback-src="([^"]+)"/g)].map((match) => match[1]);
const missingFallbacks = fallbackPaths.filter((path) => !existsInDist(path));
assert("garden image fallbacks exist in dist", missingFallbacks.length === 0, missingFallbacks.join(", "));

assert("notes page has static tag filtering", notes.includes("data-filter-scope") && notes.includes("data-filter-values") && notes.includes("data-filter-value=\"quote\""));
assert("work page has static type filtering", work.includes("data-filter-scope") && work.includes("data-filter-values") && work.includes("data-filter-value=\"Interactive room\""));
assert("notes and work filter script is bundled", notes.includes("data:text/javascript") && work.includes("data:text/javascript"));
assert("rss and sitemap are generated", existsInDist("rss.xml") && existsInDist("sitemap.xml"));
assert("deploy verification script is exposed", packageJson.scripts?.["verify:deploy"] === "node tools/verify-deploy.mjs");
assert(
  "cloudflare deployment notes cover build config and garden assets",
  cloudflareNotes.includes("Build command: `npm run build`") &&
    cloudflareNotes.includes("Build output directory: `dist`") &&
    cloudflareNotes.includes("NODE_VERSION=22.12.0") &&
    cloudflareNotes.includes("/images/silent-bloom/backgrounds/opening-silence.webp")
);
assert(
  "service readiness plan covers messages, weather, and archive",
  servicePlan.includes("第三方表单服务") &&
    servicePlan.includes("Vercel / Cloudflare serverless endpoint") &&
    servicePlan.includes("GitHub Issues / Discussions") &&
    servicePlan.includes("默认城市") &&
    servicePlan.includes("静态标签筛选")
);

const sourceFiles = [
  "src/scripts/home.js",
  "src/scripts/content-filter.js",
  "src/pages/index.astro",
  "src/pages/notes.astro",
  "src/pages/work.astro"
];
const externalRequestPattern = /\b(fetch|XMLHttpRequest)\b|navigator\.geolocation|openweathermap|api\.weather/i;
const offenders = sourceFiles.filter((file) => externalRequestPattern.test(readFileSync(join(root, file), "utf8")));
assert("static homepage/content pages make no external API requests", offenders.length === 0, offenders.join(", "));

const failures = checks.filter((check) => !check.passed);

for (const check of checks) {
  const mark = check.passed ? "PASS" : "FAIL";
  const detail = check.detail ? ` (${check.detail})` : "";
  console.log(`${mark} ${check.name}${detail}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
