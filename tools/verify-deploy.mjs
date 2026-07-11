const baseUrl = (process.argv[2] ?? process.env.JINGYIER_DEPLOY_URL ?? "https://jingyier.pages.dev").replace(/\/$/, "");

const checks = [];

const assert = (name, passed, detail = "") => {
  checks.push({ name, passed, detail });
};

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    redirect: "follow",
    ...options
  });
  return { url, response, text: options.method === "HEAD" ? "" : await response.text() };
};

const checkPage = async (path, markers) => {
  try {
    const { url, response, text } = await request(path);
    assert(`${path} returns 200`, response.ok, `${response.status} ${url}`);
    markers.forEach((marker) => {
      assert(`${path} contains ${marker}`, text.includes(marker), url);
    });
  } catch (error) {
    assert(`${path} can be fetched`, false, error instanceof Error ? error.message : String(error));
  }
};

const checkAsset = async (path, expectedType) => {
  try {
    const { url, response } = await request(path, { method: "HEAD" });
    const type = response.headers.get("content-type") ?? "";
    assert(`${path} returns 200`, response.ok, `${response.status} ${url}`);
    assert(`${path} content-type includes ${expectedType}`, type.includes(expectedType), type || url);
  } catch (error) {
    assert(`${path} can be fetched`, false, error instanceof Error ? error.message : String(error));
  }
};

const checkMessagesApi = async () => {
  try {
    const { url, response, text } = await request("/api/messages");
    const type = response.headers.get("content-type") ?? "";
    const data = JSON.parse(text);
    assert("/api/messages returns JSON", type.includes("json"), type || url);
    assert("/api/messages returns ok payload", response.ok && data.ok === true && Array.isArray(data.messages), `${response.status} ${url}`);
  } catch (error) {
    assert("/api/messages can be fetched", false, error instanceof Error ? error.message : String(error));
  }
};

await checkPage("/", ["data-home-page", "id=\"home-data\"", "jingyier"]);
await checkMessagesApi();
await checkPage("/garden/", ["data-garden-app", "data-step", "data-reset", "data-finish", "data-fallback-src"]);
await checkPage("/notes/", ["data-filter-scope", "data-filter-value=\"quote\""]);
await checkPage("/work/", ["data-filter-scope", "data-filter-value=\"Interactive room\""]);

await checkAsset("/images/silent-bloom/backgrounds/opening-silence.webp", "image/");
await checkAsset("/images/silent-bloom/backgrounds/opening-silence.png", "image/");
await checkAsset("/images/silent-bloom/props/guide-rest.webp", "image/");
await checkAsset("/images/silent-bloom/flowers/flower-open.webp", "image/");
await checkAsset("/rss.xml", "xml");
await checkAsset("/sitemap.xml", "xml");

for (const check of checks) {
  const mark = check.passed ? "PASS" : "FAIL";
  const detail = check.detail ? ` (${check.detail})` : "";
  console.log(`${mark} ${check.name}${detail}`);
}

const failures = checks.filter((check) => !check.passed);

if (failures.length > 0) {
  console.error(`\n${failures.length} deploy check(s) failed for ${baseUrl}`);
  process.exitCode = 1;
} else {
  console.log(`\nDeployment checks passed for ${baseUrl}`);
}
