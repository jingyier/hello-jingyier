import { createRenderer, type StageState } from "./renderer";

const ease = (current: number, target: number, amount: number) => current + (target - current) * amount;

export const initNanoStage = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-webgl-canvas]");
  const stage = root.querySelector<HTMLElement>("[data-camera-stage]");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-camera]"));

  if (!canvas || !stage || buttons.length === 0) {
    return;
  }

  const renderer = createRenderer(canvas);

  if (!renderer) {
    root.classList.add("is-webgl-fallback");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const views = [
    { rx: -6, ry: -18, z: 0 },
    { rx: -7, ry: -108, z: -22 },
    { rx: -8, ry: -198, z: -18 },
    { rx: -6, ry: -288, z: -24 }
  ];

  const state: StageState = {
    camera: 0,
    targetCamera: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    targetMouseX: 0.5,
    targetMouseY: 0.5,
    motion: reducedMotion.matches ? 0 : 1
  };

  let frame = 0;
  let alive = true;

  const setView = (index: number) => {
    const view = views[index] || views[0];
    state.targetCamera = index;
    root.setAttribute("data-active-camera", String(index));
    stage.style.setProperty("--rotate-x", `${view.rx}deg`);
    stage.style.setProperty("--rotate-y", `${view.ry}deg`);
    stage.style.setProperty("--camera-z", `${view.z}px`);

    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const render = (time: number) => {
    if (!alive) {
      return;
    }

    state.camera = ease(state.camera, state.targetCamera, reducedMotion.matches ? 1 : 0.075);
    state.mouseX = ease(state.mouseX, state.targetMouseX, reducedMotion.matches ? 1 : 0.09);
    state.mouseY = ease(state.mouseY, state.targetMouseY, reducedMotion.matches ? 1 : 0.09);
    state.motion = reducedMotion.matches ? 0 : 1;

    root.style.setProperty("--parallax-x", (state.mouseX - 0.5).toFixed(4));
    root.style.setProperty("--parallax-y", (state.mouseY - 0.5).toFixed(4));
    renderer.render(time, state);

    frame = window.requestAnimationFrame(render);
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    state.targetMouseX = (event.clientX - rect.left) / rect.width;
    state.targetMouseY = (event.clientY - rect.top) / rect.height;
  };

  const onPointerLeave = () => {
    state.targetMouseX = 0.5;
    state.targetMouseY = 0.5;
  };

  const onResize = () => renderer.resize();

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => setView(index));
  });

  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", onResize, { passive: true });
  setView(0);
  frame = window.requestAnimationFrame(render);

  return () => {
    alive = false;
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    renderer.destroy();
  };
};
