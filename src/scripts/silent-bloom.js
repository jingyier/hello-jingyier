const app = document.querySelector("[data-garden-app]");

if (app) {
  const stage = app.querySelector("[data-stage]");
  const pad = app.querySelector("[data-pad]");
  const spriteLayer = app.querySelector("[data-sprites]");
  const rainLayer = app.querySelector("[data-rain]");
  const trailPath = app.querySelector("[data-trail-path]");
  const guide = app.querySelector("[data-guide]");
  const meter = app.querySelector("[data-meter]");
  const phaseLabel = app.querySelector("[data-phase-label]");
  const phaseTitle = app.querySelector("[data-phase-title]");
  const dockPhaseLabel = app.querySelector("[data-dock-phase-label]");
  const dockPhaseTitle = app.querySelector("[data-dock-phase-title]");
  const localClock = app.querySelector("[data-local-clock]");
  const resetButton = app.querySelector("[data-reset]");
  const finishButton = app.querySelector("[data-finish]");
  const stepButtons = [...app.querySelectorAll("[data-step]")];

  const flowerAssets = [
    {
      src: "/images/silent-bloom/flowers/flower-closed.webp",
      fallback: "/images/silent-bloom/flowers/flower-closed.png"
    },
    {
      src: "/images/silent-bloom/flowers/flower-half-open.webp",
      fallback: "/images/silent-bloom/flowers/flower-half-open.png"
    },
    {
      src: "/images/silent-bloom/flowers/flower-open.webp",
      fallback: "/images/silent-bloom/flowers/flower-open.png"
    },
    {
      src: "/images/silent-bloom/flowers/seed-sprout.webp",
      fallback: "/images/silent-bloom/flowers/seed-sprout.png"
    }
  ];

  const phases = {
    opening: ["Opening Silence", "原初"],
    touch: ["First Touch", "伊始"],
    breath: ["Breathing Path", "花路"],
    crystal: ["Crystal Resonance", "呼应"],
    rain: ["Seed Rain", "雨落"],
    night: ["Night Garden", "夜幕"]
  };

  const plantableChapters = new Set(["opening", "touch"]);
  const chapterFlow = ["opening", "touch", "breath", "crystal", "rain", "night"];

  const state = {
    chapter: "opening",
    drawing: false,
    breathing: false,
    resonance: false,
    points: [],
    lastPoint: null,
    spawnCarry: 0,
    planted: [],
    growth: 0,
    pressTimer: null,
    guideTimer: null,
    guideDriftTimer: null,
    guidePoint: null
  };

  const useFallbackImage = (image) => {
    const fallback = image.dataset.fallbackSrc;
    if (!fallback || image.dataset.fallbackActive === "true") return;
    image.dataset.fallbackActive = "true";
    image.src = fallback;
  };

  app.querySelectorAll("img[data-fallback-src]").forEach((image) => {
    image.addEventListener("error", () => useFallbackImage(image), { once: true });
  });

  const isPlantableChapter = () => plantableChapters.has(state.chapter);

  const isInsideRect = (point, rect) => (
    point.x >= rect.x1 &&
    point.x <= rect.x2 &&
    point.y >= rect.y1 &&
    point.y <= rect.y2
  );

  const isPlantableSoil = (point) => {
    const soilBands = [
      { x1: 62, x2: 332, y1: 430, y2: 610 },
      { x1: 82, x2: 308, y1: 610, y2: 720 }
    ];
    const protectedObjects = [
      { x1: 136, x2: 238, y1: 486, y2: 626 },
      { x1: 0, x2: 78, y1: 0, y2: 844 },
      { x1: 318, x2: 390, y1: 0, y2: 844 },
      { x1: 0, x2: 390, y1: 0, y2: 412 },
      { x1: 0, x2: 390, y1: 728, y2: 844 }
    ];

    return soilBands.some((band) => isInsideRect(point, band)) &&
      !protectedObjects.some((object) => isInsideRect(point, object));
  };

  const setChapter = (chapter) => {
    const changed = state.chapter !== chapter;
    state.chapter = chapter;
    app.dataset.chapter = chapter;
    const [label, title] = phases[chapter];
    phaseLabel.textContent = label;
    phaseTitle.textContent = title;
    if (dockPhaseLabel) dockPhaseLabel.textContent = label;
    if (dockPhaseTitle) dockPhaseTitle.textContent = title;
    stepButtons.forEach((button) => {
      const active = button.dataset.step === chapter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (changed) {
      spriteLayer.replaceChildren();
      state.planted = [];
      state.points = [];
      state.lastPoint = null;
      state.spawnCarry = 0;
      updateTrail();
    }
    if (chapter === "rain") renderRain();
  };

  const setGrowth = (value) => {
    state.growth = Math.max(0, Math.min(1, value));
    meter.style.transform = `scaleX(${state.growth})`;
  };

  const toLocalPoint = (event) => {
    const rect = stage.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 390,
      y: ((event.clientY - rect.top) / rect.height) * 844,
      t: performance.now()
    };
  };

  const updateTrail = () => {
    trailPath.setAttribute("d", "");
  };

  const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const rememberPlant = (point) => {
    state.planted.push(point);
    if (state.planted.length > 180) state.planted.shift();
  };

  const isTooCloseToPlant = (point) => (
    state.planted.some((planted) => distanceBetween(point, planted) < 16)
  );

  const scatterPoint = (base, previous, next, speed) => {
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const loose = speed > 0.95;
    const side = (Math.random() - 0.5) * (loose ? 42 : 30);
    const forward = (Math.random() - 0.5) * (loose ? 18 : 12);

    return {
      x: base.x + normalX * side + (dx / length) * forward,
      y: base.y + normalY * side + (dy / length) * forward,
      t: base.t
    };
  };

  const findPlantableScatter = (base, previous, next, speed) => {
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const candidate = attempt === 0 ? base : scatterPoint(base, previous, next, speed);
      if (isPlantableSoil(candidate) && !isTooCloseToPlant(candidate)) return candidate;
    }
    return null;
  };

  const spawnFlower = (point, speed, force = false) => {
    if (!isPlantableChapter() || !isPlantableSoil(point)) return false;
    if (!force && isTooCloseToPlant(point)) return false;

    const flower = document.createElement("img");
    const sparse = speed > 1.05;
    const assetIndex = sparse && Math.random() > 0.38 ? 3 : Math.floor(Math.random() * 3);
    const asset = flowerAssets[assetIndex];
    const size = sparse ? 17 + Math.random() * 11 : 24 + Math.random() * 22;
    flower.src = asset.src;
    flower.dataset.fallbackSrc = asset.fallback;
    flower.addEventListener("error", () => useFallbackImage(flower), { once: true });
    flower.alt = "";
    flower.className = sparse ? "garden-sprite is-seed" : "garden-sprite is-flower";
    flower.style.setProperty("--x", `${point.x}px`);
    flower.style.setProperty("--y", `${point.y}px`);
    flower.style.setProperty("--size", `${size}px`);
    flower.style.setProperty("--turn", `${-18 + Math.random() * 36}deg`);
    flower.style.setProperty("--delay", `${Math.random() * -1.8}s`);
    spriteLayer.appendChild(flower);

    rememberPlant(point);
    setGrowth(state.growth + (sparse ? 0.012 : 0.024));
    if (state.chapter === "opening") setChapter("touch");
    return true;
  };

  const spawnAlongSegment = (previous, next, speed) => {
    const distance = distanceBetween(previous, next);
    const spacing = speed > 1.05 ? 38 : 24;
    let travel = state.spawnCarry + distance;
    let cursor = spacing;

    while (travel >= spacing && cursor <= distance + state.spawnCarry) {
      const localDistance = cursor - state.spawnCarry;
      const ratio = Math.max(0, Math.min(1, localDistance / Math.max(1, distance)));
      const base = {
        x: previous.x + (next.x - previous.x) * ratio,
        y: previous.y + (next.y - previous.y) * ratio,
        t: next.t
      };
      const point = findPlantableScatter(base, previous, next, speed);
      if (point) spawnFlower(point, speed);
      travel -= spacing;
      cursor += spacing;
    }

    state.spawnCarry = Math.max(0, travel);
  };

  const setBreathing = (breathing) => {
    state.breathing = breathing;
    app.dataset.breathing = String(breathing);
  };

  const setGuidePose = (pose) => {
    app.dataset.guidePose = pose;
    if (state.guideTimer) window.clearTimeout(state.guideTimer);
    if (pose === "active") {
      state.guideTimer = window.setTimeout(() => setGuidePose("rest"), 850);
    }
  };

  const moveGuide = () => {
    if (!guide || app.dataset.guidePose === "active") return;
    const range = {
      x: [32, 358],
      y: [56, 798],
      size: [54, 112]
    };
    const randomBetween = ([min, max]) => min + Math.random() * (max - min);
    const nextPoint = {
      x: randomBetween(range.x),
      y: randomBetween(range.y)
    };
    const previousPoint = state.guidePoint || nextPoint;
    const dx = nextPoint.x - previousPoint.x;
    const dy = nextPoint.y - previousPoint.y;
    const distance = Math.hypot(dx, dy);
    const heading = distance > 0.1 ? Math.atan2(dy, dx) * (180 / Math.PI) + 90 : 0;
    const duration = Math.max(6200, Math.min(10800, 5600 + distance * 9 + Math.random() * 1700));

    guide.style.setProperty("--guide-x", `${nextPoint.x.toFixed(1)}px`);
    guide.style.setProperty("--guide-y", `${nextPoint.y.toFixed(1)}px`);
    guide.style.setProperty("--guide-size", `${randomBetween(range.size).toFixed(1)}px`);
    guide.style.setProperty("--guide-heading", `${heading.toFixed(1)}deg`);
    guide.style.setProperty("--guide-duration", `${duration.toFixed(0)}ms`);
    state.guidePoint = nextPoint;
  };

  const scheduleGuideDrift = () => {
    if (state.guideDriftTimer) window.clearTimeout(state.guideDriftTimer);
    moveGuide();
    state.guideDriftTimer = window.setTimeout(scheduleGuideDrift, 6400 + Math.random() * 3000);
  };

  const triggerResonance = () => {
    if (state.resonance) return;
    state.resonance = true;
    app.dataset.resonance = "true";
    setChapter("crystal");
    setGrowth(Math.max(state.growth, 0.62));
  };

  const advanceFromGuide = () => {
    setGuidePose("active");

    if (state.chapter === "opening" && state.growth <= 0) {
      setChapter("touch");
      moveGuide();
      return;
    }

    const currentIndex = chapterFlow.indexOf(state.chapter);
    const nextChapter = chapterFlow[Math.min(currentIndex + 1, chapterFlow.length - 1)];

    if (nextChapter === "crystal") {
      triggerResonance();
      moveGuide();
      return;
    }

    if (nextChapter === "rain") {
      triggerRain();
      moveGuide();
      return;
    }

    if (nextChapter === "night") {
      finishGarden();
      moveGuide();
      return;
    }

    setChapter(nextChapter);
    moveGuide();
    if (nextChapter === "breath") {
      setBreathing(true);
      window.setTimeout(() => setBreathing(false), 1200);
    }
  };

  const renderRain = () => {
    rainLayer.replaceChildren();
    for (let i = 0; i < 42; i += 1) {
      const seed = document.createElement("span");
      seed.style.setProperty("--x", `${Math.random() * 390}px`);
      seed.style.setProperty("--delay", `${Math.random() * 2.25}s`);
      seed.style.setProperty("--drift", `${-34 + Math.random() * 68}px`);
      rainLayer.appendChild(seed);
    }
  };

  const triggerRain = () => {
    if (state.chapter === "night") return;
    setChapter("rain");
    setGrowth(Math.max(state.growth, 0.78));
  };

  const handlePointerDown = (event) => {
    if (!isPlantableChapter()) return;

    const point = toLocalPoint(event);
    if (!isPlantableSoil(point)) return;

    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    state.drawing = true;
    state.spawnCarry = 0;
    state.points.push(point);
    state.lastPoint = point;
    updateTrail();
    spawnFlower(point, 0, true);
    state.pressTimer = window.setTimeout(() => setBreathing(true), 520);
  };

  const handlePointerMove = (event) => {
    if (!isPlantableChapter()) return;
    if (!state.drawing || !state.lastPoint) return;
    const point = toLocalPoint(event);
    const dx = point.x - state.lastPoint.x;
    const dy = point.y - state.lastPoint.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 4) return;

    const speed = distance / Math.max(16, point.t - state.lastPoint.t);
    if (isPlantableSoil(point)) {
      state.points.push(point);
      if (state.points.length > 120) state.points.shift();
      updateTrail();
    }
    spawnAlongSegment(state.lastPoint, point, speed);
    state.lastPoint = point;
    if (state.pressTimer) window.clearTimeout(state.pressTimer);
    if (state.breathing && speed > 0.42) setBreathing(false);
  };

  const handlePointerUp = (event) => {
    if (!state.drawing) return;
    state.drawing = false;
    if (state.pressTimer) window.clearTimeout(state.pressTimer);
    window.setTimeout(() => setBreathing(false), 900);
  };

  const resetGarden = () => {
    state.points = [];
    state.lastPoint = null;
    state.spawnCarry = 0;
    state.planted = [];
    state.resonance = false;
    app.dataset.resonance = "false";
    spriteLayer.replaceChildren();
    rainLayer.replaceChildren();
    setBreathing(false);
    setGrowth(0);
    setChapter("opening");
    moveGuide();
    updateTrail();
  };

  const finishGarden = () => {
    setChapter("night");
    setGrowth(1);
    setBreathing(false);
    moveGuide();
  };

  const updateLocalClock = () => {
    if (!localClock) return;
    localClock.textContent = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
  };

  pad.addEventListener("pointerdown", handlePointerDown);
  pad.addEventListener("pointermove", handlePointerMove);
  pad.addEventListener("pointerup", handlePointerUp);
  pad.addEventListener("pointercancel", handlePointerUp);
  guide.addEventListener("click", advanceFromGuide);
  resetButton.addEventListener("click", resetGarden);
  finishButton.addEventListener("click", finishGarden);
  stepButtons.forEach((button) => button.addEventListener("click", () => {
    setChapter(button.dataset.step);
    moveGuide();
  }));

  setChapter("opening");
  setGrowth(0);
  setGuidePose("rest");
  scheduleGuideDrift();
  updateLocalClock();
  window.setInterval(updateLocalClock, 1000);
}
