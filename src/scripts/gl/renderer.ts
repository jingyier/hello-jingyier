import { createFullscreenTriangle } from "./geometry";
import { createProgram } from "./program";
import { fragmentShader, vertexShader } from "./shaders";
import { createStageTextures } from "./texture";

export interface StageState {
  camera: number;
  targetCamera: number;
  mouseX: number;
  mouseY: number;
  targetMouseX: number;
  targetMouseY: number;
  motion: number;
}

export interface StageRenderer {
  render: (time: number, state: StageState) => void;
  resize: () => void;
  destroy: () => void;
}

export const createRenderer = (canvas: HTMLCanvasElement): StageRenderer | null => {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false
  });

  if (!gl) {
    return null;
  }

  const mesh = createFullscreenTriangle(gl);
  const shader = createProgram(
    gl,
    vertexShader,
    fragmentShader,
    ["u_resolution", "u_mouse", "u_time", "u_camera", "u_motion", "u_noise", "u_displacement"],
    ["a_position"]
  );
  const textures = createStageTextures(gl);
  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.35 : 1.8);
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

    if (nextWidth === width && nextHeight === height) {
      return;
    }

    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const render = (time: number, state: StageState) => {
    resize();
    gl.useProgram(shader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.enableVertexAttribArray(shader.attributes.a_position);
    gl.vertexAttribPointer(shader.attributes.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.noise);
    gl.uniform1i(shader.uniforms.u_noise, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.displacement);
    gl.uniform1i(shader.uniforms.u_displacement, 1);

    gl.uniform2f(shader.uniforms.u_resolution, width, height);
    gl.uniform2f(shader.uniforms.u_mouse, state.mouseX, state.mouseY);
    gl.uniform1f(shader.uniforms.u_time, time * 0.001);
    gl.uniform1f(shader.uniforms.u_camera, state.camera);
    gl.uniform1f(shader.uniforms.u_motion, state.motion);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  };

  const destroy = () => {
    gl.deleteBuffer(mesh.buffer);
    gl.deleteTexture(textures.noise);
    gl.deleteTexture(textures.displacement);
    gl.deleteProgram(shader.program);
  };

  resize();
  return { render, resize, destroy };
};
