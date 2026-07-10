export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  attributes: Record<string, number>;
}

const compileShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

export const createProgram = (
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  uniformNames: string[],
  attributeNames: string[]
): ShaderProgram => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  const uniforms = uniformNames.reduce<Record<string, WebGLUniformLocation>>((map, name) => {
    const location = gl.getUniformLocation(program, name);

    if (location) {
      map[name] = location;
    }

    return map;
  }, {});

  const attributes = attributeNames.reduce<Record<string, number>>((map, name) => {
    map[name] = gl.getAttribLocation(program, name);
    return map;
  }, {});

  return { program, uniforms, attributes };
};
