/**
 * Fluid atmosphere shader — Direction A (Liquid Consciousness).
 * Simplex-noise driven plum/lilac haze with soft cursor warmth.
 */

export const fluidVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fluidFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uIntensity;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );
    vec3 m = max(
      0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
      0.0
    );
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * aspect;

    float t = uTime * 0.06;
    float n = snoise(p * 1.4 + vec2(t, -t * 0.7));
    n += snoise(p * 2.8 - vec2(t * 0.5, t)) * 0.5;
    n += snoise(p * 5.6 + vec2(-t * 0.3, t * 0.2)) * 0.25;
    n = n * 0.5 + 0.5;

    vec2 mouseOffset = (uMouse - 0.5) * aspect;
    float mouseDist = length(p - mouseOffset);
    float mouseGlow = smoothstep(0.9, 0.0, mouseDist) * 0.22 * uIntensity;

    vec3 nocturne = vec3(0.039, 0.043, 0.118);
    vec3 plum = vec3(0.102, 0.063, 0.200);
    vec3 lilac = vec3(0.545, 0.498, 1.000);
    vec3 rose = vec3(0.910, 0.706, 0.627);

    float vignette = 1.0 - smoothstep(0.15, 1.15, length(p));

    vec3 color = mix(nocturne, plum, n * 0.85);
    color = mix(color, lilac, smoothstep(0.55, 0.78, n) * 0.38);
    color = mix(color, rose, smoothstep(0.72, 0.92, n) * 0.12);
    color += lilac * mouseGlow;
    color *= mix(0.85, 1.15, vignette);

    float grain = fract(
      sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453
    );
    color += (grain - 0.5) * 0.014;

    gl_FragColor = vec4(color, 1.0);
  }
`;
