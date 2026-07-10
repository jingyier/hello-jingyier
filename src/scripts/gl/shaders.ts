export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_camera;
uniform float u_motion;
uniform sampler2D u_noise;
uniform sampler2D u_displacement;

varying vec2 v_uv;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float lineSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float box(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

vec3 palette(float t) {
  vec3 a = vec3(0.02, 0.01, 0.08);
  vec3 b = vec3(0.82, 0.34, 0.95);
  vec3 c = vec3(0.17, 1.0, 0.86);
  vec3 d = vec3(1.0, 0.92, 0.12);
  return mix(mix(a, b, smoothstep(0.04, 0.56, t)), mix(c, d, smoothstep(0.44, 1.0, t)), smoothstep(0.26, 0.92, t));
}

float ribbon(vec2 p, float offset, float width, float phase) {
  float y = sin(p.x * 4.2 + phase) * 0.18 + sin(p.x * 9.0 - phase * 0.7) * 0.035 + offset;
  return smoothstep(width, 0.0, abs(p.y - y));
}

void main() {
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (uv * 2.0 - 1.0) * aspect;
  vec2 mouse = (u_mouse - 0.5) * vec2(1.6, -1.1);
  float time = u_time * u_motion;
  float camera = u_camera;

  vec2 warpedUv = uv;
  vec3 disp = texture2D(u_displacement, uv * 1.65 + vec2(time * 0.018, -time * 0.012)).rgb;
  warpedUv += (disp.rg - 0.5) * 0.055 * u_motion;

  vec3 grain = texture2D(u_noise, warpedUv * 2.8 + time * 0.015).rgb;
  float radial = length(p - mouse * 0.24);
  vec3 color = mix(vec3(0.005, 0.003, 0.018), vec3(0.045, 0.008, 0.16), smoothstep(1.3, 0.1, radial));

  float cameraPhase = camera * 1.570796;
  vec2 q = p;
  q *= rotate2d(-0.28 + cameraPhase * 0.09 + mouse.x * 0.08);
  q += vec2(sin(time * 0.21 + cameraPhase), cos(time * 0.18 - cameraPhase)) * 0.055 * u_motion;

  float beamA = ribbon(q, -0.28 + mouse.y * 0.12, 0.022, time * 1.2 + cameraPhase);
  float beamB = ribbon(q * rotate2d(1.08), 0.08 - mouse.x * 0.08, 0.016, time * 0.92 - cameraPhase);
  float beamC = ribbon(q * rotate2d(-0.72), 0.34, 0.011, time * 1.54);

  color += vec3(1.0, 0.13, 0.03) * beamA * 0.82;
  color += vec3(0.08, 1.0, 0.78) * beamB * 0.94;
  color += vec3(1.0, 0.92, 0.05) * beamC * 0.72;

  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float angle = fi * 1.256 + cameraPhase * 0.42 + time * (0.045 + fi * 0.006);
    vec2 center = vec2(cos(angle), sin(angle * 0.83)) * vec2(0.38 + fi * 0.045, 0.18 + fi * 0.035);
    vec2 panel = (p - center - mouse * (0.045 + fi * 0.01)) * rotate2d(angle * 0.42);
    float d = box(panel, vec2(0.26 + fi * 0.025, 0.072 + mod(fi, 2.0) * 0.04));
    float edge = smoothstep(0.014, 0.0, abs(d));
    float fill = smoothstep(0.0, -0.024, d);
    vec3 panelColor = palette(fract(fi * 0.21 + camera * 0.16 + 0.34));
    color = mix(color, panelColor * (0.22 + grain.r * 0.2), fill * 0.48);
    color += panelColor * edge * 1.32;
  }

  vec2 grid = abs(fract((p + mouse * 0.03) * vec2(8.0, 5.0) + time * 0.015) - 0.5);
  float gridLine = 1.0 - smoothstep(0.0, 0.012, min(grid.x, grid.y));
  color += vec3(0.04, 0.92, 0.88) * gridLine * 0.09;

  for (int i = 0; i < 36; i++) {
    float fi = float(i);
    vec2 a = vec2(hash(vec2(fi, 1.0)), hash(vec2(fi, 2.0))) * 2.0 - 1.0;
    vec2 b = vec2(hash(vec2(fi, 3.0)), hash(vec2(fi, 4.0))) * 2.0 - 1.0;
    a.x *= aspect.x;
    b.x *= aspect.x;
    a += mouse * 0.05 + vec2(sin(time * 0.09 + fi), cos(time * 0.07 + fi)) * 0.045 * u_motion;
    b += mouse * -0.035 + vec2(cos(time * 0.08 + fi), sin(time * 0.06 + fi)) * 0.038 * u_motion;
    float d = lineSegment(p, a, b);
    float spark = smoothstep(0.006, 0.0, d) * (0.28 + 0.72 * hash(vec2(fi, floor(time * 6.0))));
    color += palette(fract(fi * 0.071 + camera * 0.19)) * spark * 0.32;
  }

  float scan = sin((uv.y + time * 0.08) * u_resolution.y * 0.72) * 0.5 + 0.5;
  color += (grain - 0.5) * 0.13;
  color *= 0.78 + scan * 0.12;
  color += smoothstep(0.95, 0.08, radial) * vec3(0.03, 0.0, 0.08);
  color = pow(max(color, 0.0), vec3(0.82));

  gl_FragColor = vec4(color, 1.0);
}
`;
