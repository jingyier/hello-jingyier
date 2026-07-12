import musicData from "../../src/content/music.json";

type PagesFunction<Env> = (context: { request: Request; env: Env }) => Response | Promise<Response>;

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      ...init.headers
    }
  });

export const onRequestGet: PagesFunction<unknown> = async () => {
  const currentTrack =
    musicData.tracks.find((track) => track.id === musicData.currentTrackId) ?? musicData.tracks[0];

  return json({
    ok: true,
    currentTrack,
    tracks: musicData.tracks,
    lyrics: musicData.lyrics
  });
};
