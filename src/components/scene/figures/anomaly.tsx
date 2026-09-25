"use client";

import { ScreenFigure } from "../screen-figure";

/**
 * Predictive Maintenance portresi — "anomali sinyali": yavaşça sola akan
 * sensör sinyali, kesikli eşik bandı ve bandı aşan sıçramaların etrafında
 * işaret halkaları. İlk görünüşte soldan sağa çizilir.
 */
const body = /* glsl */ `
  const float SPAN = 6.0;     // plaka genişliği boyunca sinyal birimi
  const float CELL = 1.35;    // olası anomali aralığı
  const float LIMIT = 0.95;   // eşik bandı

  float hash1(float n) { return fract(sin(n * 91.345) * 47453.21); }

  float spikeAt(float x) {
    float k = floor(x / CELL);
    float present = step(0.4, hash1(k));
    float xc = (k + 0.5) * CELL;
    float dir = hash1(k + 13.0) > 0.5 ? 1.0 : -1.0;
    return present * dir * 1.45 * exp(-pow((x - xc) / 0.07, 2.0));
  }

  float signal(float x) {
    return 0.34 * sin(1.3 * x) + 0.2 * sin(3.1 * x + 1.0) + 0.09 * sin(7.7 * x + 2.0)
         + spikeAt(x);
  }

  vec4 figure(vec2 p) {
    vec2 size = uRect.zw - uRect.xy;
    vec2 uv = (p - uRect.xy) / size;

    // Viewport'a girince 900ms ease-out kendini çizer, sonra çok yavaş akar.
    float progress = clamp(uAge / 0.9, 0.0, 1.0);
    progress = 1.0 - pow(1.0 - progress, 3.0);
    float drawn = 1.0 - smoothstep(progress - 0.02, progress, uv.x);

    // Yavaş akış + içerikten 0.15 daha yavaş scroll paralaksı
    float shift = uTime * 0.12;
    float x = uv.x * SPAN + shift;
    float cy = uRect.y + size.y * 0.5 + (uScroll - uRect.y) * 0.15;
    float H = size.y * 0.30;

    float v = signal(x);
    float dx = SPAN / size.x;
    float slope = (signal(x + dx) - signal(x - dx)) * 0.5 * H;
    float d = abs(p.y - (cy - v * H)) / sqrt(1.0 + slope * slope);
    float curve = 1.0 - smoothstep(0.5, 1.5, d);

    // Kesikli eşik çizgileri ve zayıf zaman ekseni (1px).
    float dash = step(0.5, fract(p.x / 8.0));
    float band = (1.0 - smoothstep(0.0, 1.0, abs(abs(p.y - cy) - LIMIT * H) - 0.2)) * dash;
    float axis = 1.0 - smoothstep(0.0, 1.0, abs(p.y - cy) - 0.2);

    // Bandı aşan sıçramaların tepe noktasında 1px boş halka (dolgu/gölge/glow yok).
    float k = floor(x / CELL);
    float xc = (k + 0.5) * CELL;
    float peak = signal(xc);
    vec2 center = vec2(uRect.x + (xc - shift) / SPAN * size.x, cy - peak * H);
    float ring = (1.0 - smoothstep(0.5, 1.5, abs(length(p - center) - 8.0))) * step(LIMIT, abs(peak));

    // Alpha: varsayılan ~0.35, hover ~0.60 (250ms), mobilde (<1024px) 0.25
    float isMobile = step(uRes.x / uPx, 1024.0);
    float targetAlpha = mix(mix(0.35, 0.60, uHover), 0.25, isMobile);
    float rawAlpha = curve * 0.85 + ring * 0.85 + band * 0.35 + axis * 0.2;
    float alpha = clamp(rawAlpha, 0.0, 1.0) * targetAlpha * drawn;
    return vec4(ink(toneAt(p.y)), alpha);
  }
`;

export function AnomalyFigure() {
  return <ScreenFigure id="anomaly" body={body} />;
}
