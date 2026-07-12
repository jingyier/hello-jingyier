type PagesFunction<Env> = (context: { request: Request; env: Env }) => Response | Promise<Response>;

interface Env {
  WEATHER_LATITUDE?: string;
  WEATHER_LONGITUDE?: string;
  WEATHER_LOCATION_NAME?: string;
  WEATHER_TIMEZONE?: string;
}

interface OpenMeteoResponse {
  current_weather?: {
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
    time?: string;
  };
}

const DEFAULT_LOCATION = {
  name: "南昌",
  latitude: 28.6829,
  longitude: 115.8582,
  timezone: "Asia/Shanghai"
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "晴",
  1: "大多晴朗",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "毛毛雨",
  53: "小雨",
  55: "中雨",
  56: "冻雨",
  57: "强冻雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨",
  81: "较强阵雨",
  82: "强阵雨",
  85: "阵雪",
  86: "强阵雪",
  95: "雷暴",
  96: "雷暴伴冰雹",
  99: "强雷暴伴冰雹"
};

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=1800",
      ...init.headers
    }
  });

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickLocation = (env: Env) => ({
  name: env.WEATHER_LOCATION_NAME?.trim() || DEFAULT_LOCATION.name,
  latitude: parseNumber(env.WEATHER_LATITUDE, DEFAULT_LOCATION.latitude),
  longitude: parseNumber(env.WEATHER_LONGITUDE, DEFAULT_LOCATION.longitude),
  timezone: env.WEATHER_TIMEZONE?.trim() || DEFAULT_LOCATION.timezone
});

const resolveWeatherLabel = (code?: number) => WEATHER_CODE_LABELS[Number(code)] ?? "未知天气";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const location = {
    name: url.searchParams.get("location")?.trim() || pickLocation(env).name,
    latitude: parseNumber(url.searchParams.get("lat") ?? undefined, pickLocation(env).latitude),
    longitude: parseNumber(url.searchParams.get("lon") ?? undefined, pickLocation(env).longitude),
    timezone: url.searchParams.get("timezone")?.trim() || pickLocation(env).timezone
  };

  try {
    const upstream = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&timezone=${encodeURIComponent(location.timezone)}`,
      {
        headers: { accept: "application/json" }
      }
    );

    const payload = (await upstream.json()) as OpenMeteoResponse;
    const current = payload.current_weather;

    if (!upstream.ok || !current) {
      return json({ ok: false, error: "weather_service_unavailable" }, { status: 503 });
    }

    return json({
      ok: true,
      location,
      weather: {
        condition: resolveWeatherLabel(current.weathercode),
        code: current.weathercode,
        temperature: current.temperature,
        windSpeed: current.windspeed,
        observedAt: current.time
      }
    });
  } catch {
    return json({ ok: false, error: "weather_service_unavailable" }, { status: 503 });
  }
};
