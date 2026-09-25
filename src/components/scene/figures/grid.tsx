"use client";

import { ScreenFigure } from "../screen-figure";

/**
 * "Perspektif kareli kâğıt": masaya hafif eğik yatmış bir kareli defter
 * sayfası. Ekran → düzlem homografisi (u, v) = (x, y) / (1 - k·y): kareler
 * yukarı doğru küçülür. Scroll, içerikten yavaş (paralaks) kaydırır → derinlik.
 * Her 5. çizgi biraz daha belirgin. Metin sütununda alpha düşer.
 */
const body = /* glsl */ `
  const float CELL = 30.0;      // en yakın (alt) sıradaki kare, CSS px
  const float TILT = 0.38;      // eğiklik: üstte kareler ~%62 boyutta
  const float PARALLAX = 0.22;  // içerik hızına oranla (gramer: <= 0.25)

  float gridLine(vec2 uv, float widthPx) {
    vec2 w = fwidth(uv);
    vec2 d = abs(fract(uv - 0.5) - 0.5) / max(w, vec2(1e-4));
    vec2 l = 1.0 - smoothstep(vec2(widthPx * 0.5), vec2(widthPx * 0.5 + 1.0), d);
    return max(l.x, l.y);
  }

  vec4 figure(vec2 css) {
    vec2 size = uRes / uPx;
    float yUp = 1.0 - css.y / size.y;
    float depth = 1.0 - TILT * yUp;
    vec2 plane = vec2((css.x - 0.5 * size.x) / depth, (yUp * size.y) / depth);
    plane.y += uScroll * PARALLAX;
    vec2 uv = plane / CELL;

    float minor = gridLine(uv, uPx);
    float major = gridLine(uv / 5.0, uPx * 1.1);

    // Faz 2 değerleri: minor 0.04, major 0.085; uzakta x0.55, metin sütununda x0.55.
    float fade = mix(1.0, 0.55, yUp);
    float column = 1.0 - 0.45 * (1.0 - smoothstep(300.0, 460.0, abs(css.x - 0.5 * size.x)));
    float alpha = max(minor * 0.04, major * 0.085) * fade * column;
    return vec4(ink(toneAt(css.y)), alpha);
  }
`;

export function GridFigure() {
  return <ScreenFigure id="grid" body={body} />;
}
