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
const homePage = readFileSync(join(root, "src/pages/index.astro"), "utf8");
const messageFunction = readFileSync(join(root, "functions/api/messages.ts"), "utf8");
const d1Schema = readFileSync(join(root, "db/schema.sql"), "utf8");
const homeData = JSON.parse(readFileSync(join(root, "src/content/home.json"), "utf8"));
const servicePlan = readFileSync(join(root, "docs/service-readiness-plan.md"), "utf8");
const cloudflareNotes = readFileSync(join(root, "docs/cloudflare-pages.md"), "utf8");
const designPlan = readFileSync(join(root, "DESIGN.md"), "utf8");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

assert("core pages are generated", Boolean(index && about && garden && notes && work));
assert("home-data JSON is present", index.includes('id="home-data"'));
assert("home links do not contain #undefined", !index.includes("#undefined"));
assert("home page does not include garden app shell", !index.includes("garden-app") && !index.includes("phone-frame"));
assert("home content has expanded static pools", homeData.quotes.length >= 8 && homeData.weatherNotes.length >= 5);
assert("home script reads embedded JSON with fallback defaults", homeScript.includes("querySelector(\"#home-data\")") && homeScript.includes("return defaults"));
assert("home script updates HH:mm:ss clocks", homeScript.includes("second: \"2-digit\"") && homeScript.includes("window.setInterval(updateClock, 1000)"));
assert("home script cycles quotes and weather/status pools", homeScript.includes("state.quoteIndex = (state.quoteIndex + 1) % quotes.length") && homeScript.includes("state.weatherIndex = (state.weatherIndex + 1) % weatherNotes.length"));
assert("home script supports local message fallback", homeScript.includes("data-message-local-list") && homeScript.includes("state.messages.push({ body: value"));
assert("home script persists browser-only state and falls back safely", homeScript.includes("window.localStorage") && homeScript.includes("storageEnabled") && homeScript.includes("刷新页面后不会保留"));
assert("home page has reviewed message containers and honeypot", homePage.includes("message-board-card") && homePage.includes("data-message-approved-list") && homePage.includes("data-message-local-list") && homePage.includes("message-honeypot"));
assert("home script submits to same-origin message API first", homeScript.includes("fetch(\"/api/messages\"") && homeScript.includes("审核后会公开显示"));
assert("home script falls back to local messages when API fails", homeScript.includes("接口暂时不可用") && homeScript.includes("state.messages.push({ body: value"));
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
  "service readiness plan selects D1 for messages and covers weather/archive",
  servicePlan.includes("Cloudflare D1 + Pages Functions") &&
    servicePlan.includes("jingyier_messages") &&
    servicePlan.includes("GitHub Issues / Discussions") &&
    servicePlan.includes("默认城市") &&
    servicePlan.includes("静态标签筛选")
);

assert(
  "D1 schema creates reviewed messages table",
  d1Schema.includes("CREATE TABLE IF NOT EXISTS messages") &&
    d1Schema.includes("status IN ('pending', 'approved', 'rejected')") &&
    d1Schema.includes("messages_status_created_at_idx") &&
    d1Schema.includes("user_agent_hash") &&
    d1Schema.includes("ip_hash")
);

assert(
  "Pages Function exposes approved GET and pending POST",
  messageFunction.includes("onRequestGet") &&
    messageFunction.includes("onRequestPost") &&
    messageFunction.includes("WHERE status = ?") &&
    messageFunction.includes(".bind(\"approved\", 20)") &&
    messageFunction.includes("'pending'") &&
    messageFunction.includes("crypto.randomUUID") &&
    messageFunction.includes("env.DB")
);

assert(
    "docs describe Cloudflare D1 message setup",
  designPlan.includes("Cloudflare Pages Functions + D1") &&
    designPlan.includes("jingyier_messages") &&
    cloudflareNotes.includes("Binding name: `DB`") &&
    cloudflareNotes.includes("SELECT id, body, status, created_at") &&
    cloudflareNotes.includes("WHERE id='实际留言ID'")
);

const sourceFiles = [
  "src/scripts/home.js",
  "src/scripts/content-filter.js",
  "src/pages/index.astro",
  "src/pages/notes.astro",
  "src/pages/work.astro"
];
const sourceSnapshots = sourceFiles.map((file) => [file, readFileSync(join(root, file), "utf8")]);
const externalOffenders = sourceSnapshots
  .filter(([, contents]) => /https?:\/\/|XMLHttpRequest|navigator\.geolocation|openweathermap|api\.weather/i.test(contents))
  .map(([file]) => file);
const disallowedFetchOffenders = sourceSnapshots
  .filter(([, contents]) => /\bfetch\s*\(/.test(contents) && !contents.includes("fetch(\"/api/messages\""))
  .map(([file]) => file);
assert("homepage/content pages make no external API requests", externalOffenders.length === 0, externalOffenders.join(", "));
assert("homepage fetches only same-origin messages API", disallowedFetchOffenders.length === 0, disallowedFetchOffenders.join(", "));

const failures = checks.filter((check) => !check.passed);

for (const check of checks) {
  const mark = check.passed ? "PASS" : "FAIL";
  const detail = check.detail ? ` (${check.detail})` : "";
  console.log(`${mark} ${check.name}${detail}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
