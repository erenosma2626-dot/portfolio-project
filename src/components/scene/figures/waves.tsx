"use client";

import { ScreenFigure } from "../screen-figure";

/**
 * "Akan sinüs yazı satırları" (§3 Writings): defter satırları; bazı satır
 * parçalarında el yazısını andıran sinüs "kelimeleri" soldan sağa kendini
 * yazar gibi akar. Kelime = zarf (envelope) altındaki kısa dalga paketi.
 * Mesafe, türev ile normalize edilir → her eğimde sabit piksel kalınlık.
 */
const body = /* glsl */ `
  const float ROW = 54.0;
  const float WORD = 190.0;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Satır r'de, x (CSS px) konumunda: (dikey sapma, mürekkep zarfı 0..1).
  vec2 inkAt(float x, float r, float t) {
    float flow = x + t * 18.0 + hash(vec2(r, 3.0)) * 500.0;
    float word = floor(flow / WORD);
    float local = fract(flow / WORD);
    float present = step(0.5, hash(vec2(word, r))) * step(0.3, hash(vec2(r, 5.0)));
    float len = mix(0.35, 0.75, hash(vec2(r, word + 7.0)));
    float env = smoothstep(0.0, 0.1, local) * (1.0 - smoothstep(len - 0.12, len, local)) * present;
    float amp = mix(4.0, 8.0, hash(vec2(word + 2.0, r)));
    float k = mix(0.16, 0.24, hash(vec2(r, 11.0)));
    // İki harmonik + yavaş baseline salınımı: el yazısı ritmi.
    float y = sin(flow * k) + 0.45 * sin(flow * k * 2.7 + 1.3) + 0.25 * sin(flow * 0.021 + r);
    return vec2(env * amp * y, env);
  }

  vec4 figure(vec2 p) {
    float t = uTime;
    float r = floor(p.y / ROW);
    float yLocal = p.y - (r + 0.6) * ROW;

    vec2 c = inkAt(p.x, r, t);
    float slope = (inkAt(p.x + 1.0, r, t).x - inkAt(p.x - 1.0, r, t).x) * 0.5;
    float d = abs(yLocal - c.x) / sqrt(1.0 + slope * slope);
    float stroke = (1.0 - smoothstep(0.5, 1.5, d)) * smoothstep(0.02, 0.35, c.y);

    // Çok soluk defter satırı.
    float rule = 1.0 - smoothstep(0.0, 1.0, abs(yLocal - 9.0) - 0.2);

    // İçerik sütununda sessiz, kenarlarda belirgin; en dış kenarda sönüm.
    vec2 size = uRes / uPx;
    float dx = abs(p.x - 0.5 * size.x);
    float column = mix(0.12, 1.0, smoothstep(240.0, 520.0, dx));
    float edge = 1.0 - smoothstep(0.44 * size.x, 0.5 * size.x, dx);

    float alpha = (stroke * 0.3 + rule * 0.035) * column * edge;
    return vec4(ink(toneAt(p.y)), alpha);
  }
`;

export function WavesFigure() {
  return <ScreenFigure id="waves" body={body} />;
}
