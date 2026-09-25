"use client";

import { ScreenFigure } from "../screen-figure";

/**
 * "Nefes alan kontur haritası": birkaç yavaş gezinen Gauss tepesinin
 * toplamından oluşan skaler alanın izolinleri. Çizgiler fwidth ile piksel
 * genişliğinde antialias'lanır; her 5. izolin hafifçe daha belirgin (harita
 * "index" çizgisi). Merkezdeki içerik sütununda maske ile neredeyse kaybolur.
 */
const body = /* glsl */ `
  float bump(vec2 p, vec2 c, float r) {
    vec2 d = p - c;
    return exp(-dot(d, d) / r);
  }

  float field(vec2 p, float t) {
    float f = 0.0;
    f += 1.00 * bump(p, vec2(-0.95 + 0.10 * sin(t * 0.13), 0.35 + 0.08 * cos(t * 0.11)), 0.30);
    f += 0.85 * bump(p, vec2(1.05 + 0.08 * cos(t * 0.09), -0.30 + 0.10 * sin(t * 0.12)), 0.26);
    f += 0.55 * bump(p, vec2(0.55 + 0.12 * sin(t * 0.07 + 1.3), 0.62 + 0.06 * sin(t * 0.1)), 0.14);
    f -= 0.45 * bump(p, vec2(-0.35 + 0.1 * cos(t * 0.08), -0.55 + 0.07 * sin(t * 0.14)), 0.20);
    f += 0.30 * bump(p, vec2(-1.35, -0.7 + 0.1 * sin(t * 0.06)), 0.18);
    f += 0.06 * sin(p.x * 2.1 + t * 0.05) * cos(p.y * 1.7 - t * 0.04);
    return f;
  }

  vec4 figure(vec2 px) {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;
    // Nefes: alan çok yavaş genişleyip daralır.
    float breathe = 1.0 + 0.035 * sin(uTime * 0.45);
    float v = field(p / breathe, uTime) * 14.0;

    float w = fwidth(v);
    float d = abs(fract(v - 0.5) - 0.5) / max(w, 1e-4);
    float line = 1.0 - smoothstep(0.4 * uPx, 0.4 * uPx + 1.0, d);

    float level = floor(v + 0.5);
    float index = step(abs(mod(level, 5.0)), 0.5);

    // İçerik sütunu maskesi: merkezde ≈0.04, kenarlarda ≈0.2 alpha.
    float m = smoothstep(0.35, 1.05, length(p * vec2(0.62, 1.05)));
    float alpha = line * mix(0.04, 0.2, m) * mix(1.0, 1.45, index);
    return vec4(ink(toneAt(px.y)), alpha);
  }
`;

export function ContourFigure() {
  return <ScreenFigure id="contour" body={body} />;
}
