export interface StageTextures {
  noise: WebGLTexture;
  displacement: WebGLTexture;
}

const createCanvasTexture = (
  gl: WebGLRenderingContext,
  size: number,
  paint: (data: Uint8ClampedArray, size: number) => void
) => {
  const data = new Uint8ClampedArray(size * size * 4);
  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Unable to create WebGL texture.");
  }

  paint(data, size);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

  return texture;
};

const seeded = (x: number, y: number, salt: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
};

export const createStageTextures = (gl: WebGLRenderingContext): StageTextures => {
  const noise = createCanvasTexture(gl, 128, (data, size) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        data[i] = 80 + seeded(x, y, 1) * 175;
        data[i + 1] = 55 + seeded(x, y, 2) * 200;
        data[i + 2] = 110 + seeded(x, y, 3) * 145;
        data[i + 3] = 255;
      }
    }
  });

  const displacement = createCanvasTexture(gl, 96, (data, size) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        const wave = Math.sin((x / size) * Math.PI * 8) + Math.cos((y / size) * Math.PI * 7);
        const scratch = seeded(x, y, 9) * 0.42;
        const value = Math.max(0, Math.min(255, 128 + wave * 42 + scratch * 255));
        data[i] = value;
        data[i + 1] = 255 - value * 0.5;
        data[i + 2] = 210 + seeded(x, y, 4) * 45;
        data[i + 3] = 255;
      }
    }
  });

  return { noise, displacement };
};
