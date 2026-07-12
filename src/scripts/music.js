const musicRoots = [...document.querySelectorAll("[data-music-root]")];

if (musicRoots.length > 0) {
  const readEmbeddedMusic = () => {
    const node = document.querySelector("#music-data");
    if (!node) return { tracks: [], lyrics: [], currentTrackId: "" };
    try {
      return JSON.parse(node.textContent ?? "{}");
    } catch {
      return { tracks: [], lyrics: [], currentTrackId: "" };
    }
  };

  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const state = {
    data: readEmbeddedMusic(),
    trackIndex: 0,
    playing: false
  };

  const getCurrentTrack = () => {
    const tracks = state.data.tracks ?? [];
    return tracks[state.trackIndex] ?? tracks[0];
  };

  const setTrackFromId = (trackId) => {
    const index = (state.data.tracks ?? []).findIndex((track) => track.id === trackId);
    state.trackIndex = index >= 0 ? index : 0;
  };

  const render = () => {
    const track = getCurrentTrack();
    if (!track) return;

    document.querySelectorAll("[data-music-title]").forEach((node) => {
      node.textContent = track.title;
    });
    document.querySelectorAll("[data-music-artist]").forEach((node) => {
      node.textContent = track.artist;
    });
    document.querySelectorAll("[data-music-album]").forEach((node) => {
      node.textContent = track.album;
    });
    document.querySelectorAll("[data-music-duration]").forEach((node) => {
      node.textContent = track.duration ?? "00:00";
    });
    document.querySelectorAll("[data-music-cover]").forEach((node) => {
      node.setAttribute("src", track.cover);
      node.setAttribute("alt", track.coverAlt ?? "");
    });
    document.querySelectorAll("[data-music-playable]").forEach((node) => {
      node.textContent = track.playable ? "可播放" : "预览模式";
    });
    document.querySelectorAll("[data-music-root]").forEach((node) => {
      node.dataset.playing = String(state.playing);
      node.dataset.playable = String(Boolean(track.playable && track.audioSrc));
    });
  };

  const loadRemoteMusic = async () => {
    if (isLocalHost) return;
    try {
      const response = await fetch("/api/music", { headers: { "accept": "application/json" } });
      const result = await response.json();
      if (response.ok && result.ok && Array.isArray(result.tracks)) {
        state.data = {
          currentTrackId: result.currentTrack?.id ?? result.tracks[0]?.id,
          tracks: result.tracks,
          lyrics: result.lyrics ?? []
        };
        setTrackFromId(state.data.currentTrackId);
      }
    } catch {
      // Static embedded music data is the fallback for local and static environments.
    }
  };

  setTrackFromId(state.data.currentTrackId);

  document.querySelectorAll("[data-music-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.playing = !state.playing;
      render();
    });
  });

  document.querySelectorAll("[data-music-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const total = state.data.tracks?.length ?? 0;
      if (total === 0) return;
      state.trackIndex = (state.trackIndex + 1) % total;
      state.playing = false;
      render();
    });
  });

  document.querySelectorAll("[data-music-prev]").forEach((button) => {
    button.addEventListener("click", () => {
      const total = state.data.tracks?.length ?? 0;
      if (total === 0) return;
      state.trackIndex = (state.trackIndex - 1 + total) % total;
      state.playing = false;
      render();
    });
  });

  loadRemoteMusic().finally(render);
}
