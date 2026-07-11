interface D1Result<T> {
  results?: T[];
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

type PagesFunction<Env> = (context: { request: Request; env: Env }) => Response | Promise<Response>;

interface Env {
  DB?: D1Database;
}

interface MessageRow {
  id: string;
  body: string;
  created_at: string;
}

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers
    }
  });

const normalizeMessage = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const hashText = async (value: string) => {
  if (!value) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const getClientIp = (request: Request) =>
  request.headers.get("CF-Connecting-IP") ??
  request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
  "";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return json({ ok: false, error: "message_service_unavailable" }, { status: 503 });
  }

  try {
    const result = await env.DB.prepare(
      "SELECT id, body, created_at FROM messages WHERE status = ? ORDER BY created_at DESC LIMIT ?"
    )
      .bind("approved", 20)
      .all<MessageRow>();

    const messages = (result.results ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.created_at
    }));

    return json(
      { ok: true, messages },
      { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch {
    return json({ ok: false, error: "message_service_unavailable" }, { status: 503 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) {
    return json({ ok: false, error: "message_service_unavailable" }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json<Record<string, unknown>>();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (normalizeMessage(payload.website)) {
    return json({ ok: true });
  }

  const body = normalizeMessage(payload.body);
  if (!body) {
    return json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  if (body.length > 120) {
    return json({ ok: false, error: "message_too_long" }, { status: 400 });
  }

  try {
    const id = crypto.randomUUID();
    const [userAgentHash, ipHash] = await Promise.all([
      hashText(request.headers.get("User-Agent") ?? ""),
      hashText(getClientIp(request))
    ]);

    await env.DB.prepare(
      "INSERT INTO messages (id, body, status, created_at, user_agent_hash, ip_hash, source) VALUES (?, ?, 'pending', datetime('now'), ?, ?, ?)"
    )
      .bind(id, body, userAgentHash, ipHash, "home")
      .run();

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "message_service_unavailable" }, { status: 503 });
  }
};
