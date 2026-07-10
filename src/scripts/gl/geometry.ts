export interface Mesh {
  buffer: WebGLBuffer;
  count: number;
}

export const createFullscreenTriangle = (gl: WebGLRenderingContext): Mesh => {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("Unable to create WebGL buffer.");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  return { buffer, count: 3 };
};
