const playlistId = "12735729287";
const metingEndpoint = `https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${playlistId}`;

const createMusicController = () => {
  const state = {
    tracks: [],
    players: new Map(),
    activeIndex: 0,
    activeTab: "playlist",
    query: "",
    lyricsCache: new Map(),
    playlistPromise: null,
    rafId: 0
  };

  const waitForAPlayer = () => new Promise((resolve) => {
    if (window.APlayer) {
      resolve(window.APlayer);
      return;
    }

    window.addEventListener("load", () => resolve(window.APlayer), { once: true });
  });

  const normalizeTrack = (track, index) => ({
    name: track.title ?? `Track ${index + 1}`,
    artist: track.author ?? "Netease",
    url: track.url,
    cover: track.pic,
    lrc: track.lrc,
    theme: "#8a90ff"
  });

  const fetchPlaylist = async () => {
    if (state.tracks.length > 0) return state.tracks;
    if (state.playlistPromise) return state.playlistPromise;

    state.playlistPromise = fetch(metingEndpoint, { headers: { "accept": "application/json" } })
      .then((response) => response.json().then((result) => ({ response, result })))
      .then(({ response, result }) => {
        if (!response.ok || !Array.isArray(result) || result.length === 0) {
          throw new Error("playlist_unavailable");
        }
        state.tracks = result.map(normalizeTrack).filter((track) => track.url);
        return state.tracks;
      });

    return state.playlistPromise;
  };

  const formatTime = (value) => {
    if (!Number.isFinite(value) || value <= 0) return "00:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getPrimaryPlayer = () => state.players.get("fixed") ?? state.players.get("page");
  const getActiveTrack = () => state.tracks[state.activeIndex] ?? state.tracks[0];

  const setStatus = (text) => {
    document.querySelectorAll("[data-music-count]").forEach((node) => {
      node.textContent = text;
    });
  };

  const syncHomePlayer = () => {
    if (state.rafId) window.cancelAnimationFrame(state.rafId);
    const track = getActiveTrack();
    if (!track) return;

    document.querySelectorAll("[data-home-music-cover]").forEach((node) => {
      node.setAttribute("src", track.cover);
    });
    document.querySelectorAll("[data-home-music-title]").forEach((node) => {
      node.textContent = track.name;
    });
    document.querySelectorAll("[data-home-music-artist], [data-home-music-author]").forEach((node) => {
      node.textContent = track.artist;
    });

    const player = getPrimaryPlayer();
    const audio = player?.audio;
    const current = audio?.currentTime ?? 0;
    const duration = audio?.duration ?? 0;
    const percent = duration > 0 ? Math.min(1, current / duration) : 0;

    document.querySelectorAll("[data-home-music-current]").forEach((node) => {
      node.textContent = formatTime(current);
    });
    document.querySelectorAll("[data-home-music-bar]").forEach((node) => {
      node.style.transform = `scaleX(${percent})`;
    });
    document.querySelectorAll("[data-home-music-toggle]").forEach((button) => {
      button.dataset.playing = String(Boolean(audio && !audio.paused));
    });

    state.rafId = window.requestAnimationFrame(syncHomePlayer);
  };

  const setNowPlaying = (index = state.activeIndex) => {
    const track = state.tracks[index];
    if (!track) return;
    state.activeIndex = index;

    document.querySelectorAll("[data-music-now-title]").forEach((node) => {
      node.textContent = track.name;
    });
    document.querySelectorAll("[data-music-now-artist]").forEach((node) => {
      node.textContent = track.artist;
    });
    document.querySelectorAll("[data-music-lyrics-title]").forEach((node) => {
      node.textContent = track.name;
    });
    document.querySelectorAll("[data-music-track-index]").forEach((node) => {
      node.classList.toggle("is-current", Number(node.dataset.musicTrackIndex) === index);
    });

    syncHomePlayer();
  };

  const parseLyrics = (value) => value
    .split(/\r?\n/)
    .map((line) => line.replace(/\[[^\]]+\]/g, "").trim())
    .filter(Boolean)
    .slice(0, 48);

  const renderLyrics = async (index = state.activeIndex) => {
    const track = state.tracks[index];
    const container = document.querySelector("[data-music-lyrics]");
    if (!track || !container) return;

    container.textContent = "";
    const loading = document.createElement("p");
    loading.textContent = "歌词载入中...";
    container.append(loading);

    try {
      if (!state.lyricsCache.has(index)) {
        const response = await fetch(track.lrc);
        const text = await response.text();
        state.lyricsCache.set(index, parseLyrics(text));
      }

      const lyrics = state.lyricsCache.get(index);
      container.textContent = "";
      if (!lyrics || lyrics.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "这首歌暂时没有可显示的歌词。";
        container.append(empty);
        return;
      }
      lyrics.forEach((line) => {
        const node = document.createElement("p");
        node.textContent = line;
        container.append(node);
      });
    } catch {
      container.textContent = "";
      const error = document.createElement("p");
      error.textContent = "歌词暂时无法载入。";
      container.append(error);
    }
  };

  const setActiveTab = (tab) => {
    state.activeTab = tab;
    document.querySelectorAll("[data-music-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.musicTab === tab));
    });
    document.querySelectorAll("[data-music-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.musicPanel !== tab;
    });
    if (tab === "lyrics") renderLyrics();
  };

  const renderTrackList = () => {
    const list = document.querySelector("[data-music-track-list]");
    if (!list) return;

    const query = state.query.trim().toLowerCase();
    const matches = state.tracks
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => {
        if (!query) return true;
        return `${track.name} ${track.artist}`.toLowerCase().includes(query);
      });

    list.textContent = "";
    if (matches.length === 0) {
      const empty = document.createElement("p");
      empty.className = "music-empty";
      empty.textContent = "没有匹配的歌曲。";
      list.append(empty);
      return;
    }

    matches.forEach(({ track, index }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "music-track-row";
      button.dataset.musicTrackIndex = String(index);
      button.innerHTML = `
        <img src="${track.cover}" alt="" loading="lazy" />
        <span>
          <strong></strong>
          <small></small>
        </span>
      `;
      button.querySelector("strong").textContent = track.name;
      button.querySelector("small").textContent = track.artist;
      button.addEventListener("click", () => playTrack(index));
      list.append(button);
    });

    setNowPlaying(state.activeIndex);
  };

  const createPlayer = (APlayerCtor, root, audio) => {
    const mode = root.dataset.musicPlayer;
    if (state.players.has(mode) || root.querySelector(".aplayer")) {
      return state.players.get(mode);
    }

    const options = {
      container: root,
      audio,
      autoplay: false,
      mutex: true,
      preload: "metadata",
      theme: "#8a90ff",
      lrcType: 3,
      listFolded: true,
      listMaxHeight: mode === "page" ? "16rem" : "10rem"
    };

    if (mode === "fixed") {
      options.fixed = true;
      options.mini = true;
    }

    const player = new APlayerCtor(options);
    state.players.set(mode, player);

    player.on?.("listswitch", (event) => {
      const index = typeof event === "number" ? event : player.list?.index;
      if (Number.isInteger(index)) {
        setNowPlaying(index);
        if (state.activeTab === "lyrics") renderLyrics(index);
      }
    });
    player.on?.("play", syncHomePlayer);
    player.on?.("pause", syncHomePlayer);

    return player;
  };

  const playTrack = (index) => {
    const player = getPrimaryPlayer();
    if (!player) return;
    state.activeIndex = index;
    player.list?.switch?.(index);
    player.play?.();
    setNowPlaying(index);
    if (state.activeTab === "lyrics") renderLyrics(index);
  };

  const bindHomePlayer = () => {
    document.querySelectorAll("[data-home-music]").forEach((root) => {
      if (root.dataset.bound === "true") return;
      root.dataset.bound = "true";

      root.querySelector("[data-home-music-prev]")?.addEventListener("click", () => {
        const nextIndex = (state.activeIndex - 1 + state.tracks.length) % state.tracks.length;
        playTrack(nextIndex);
      });
      root.querySelector("[data-home-music-next]")?.addEventListener("click", () => {
        const nextIndex = (state.activeIndex + 1) % state.tracks.length;
        playTrack(nextIndex);
      });
      root.querySelector("[data-home-music-toggle]")?.addEventListener("click", () => {
        const player = getPrimaryPlayer();
        if (!player) return;
        if (player.audio?.paused) {
          player.play?.();
        } else {
          player.pause?.();
        }
        syncHomePlayer();
      });
      root.querySelector("[data-home-music-seek]")?.addEventListener("click", (event) => {
        const player = getPrimaryPlayer();
        if (!player?.audio?.duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        player.seek?.(player.audio.duration * percent);
        syncHomePlayer();
      });
    });

    syncHomePlayer();
  };

  const bindMusicLibrary = () => {
    if (!document.querySelector("[data-music-page]")) return;

    const search = document.querySelector("[data-music-search]");
    if (search && search.dataset.bound !== "true") {
      search.dataset.bound = "true";
      search.addEventListener("input", (event) => {
        state.query = event.currentTarget.value;
        renderTrackList();
      });
    }

    document.querySelectorAll("[data-music-tab]").forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => setActiveTab(button.dataset.musicTab));
    });

    setStatus(`${state.tracks.length} 首 / 网易云歌单 ${playlistId}`);
    renderTrackList();
    setActiveTab(state.activeTab);
  };

  const mount = async () => {
    const roots = [...document.querySelectorAll("[data-music-player]")];
    if (roots.length === 0 && !document.querySelector("[data-home-music]")) return;

    const APlayerCtor = await waitForAPlayer();
    if (!APlayerCtor) {
      setStatus("播放器脚本暂时无法载入。");
      return;
    }

    try {
      await fetchPlaylist();
    } catch {
      setStatus("歌单暂时无法载入，请稍后再试。");
      return;
    }

    roots.forEach((root) => createPlayer(APlayerCtor, root, state.tracks));
    bindHomePlayer();
    bindMusicLibrary();
    setNowPlaying(state.activeIndex);
  };

  return { mount };
};

window.__jingyierMusic ??= createMusicController();
window.__jingyierMusic.mount();
document.addEventListener("astro:page-load", () => window.__jingyierMusic.mount());
