"use client";

import { ScreenFigure } from "../screen-figure";

/**
 * "İletişime yakınsayan vektör alanı" (§4 Contact): merkeze sarmal olarak
 * akan logaritmik akış çizgileri. Çizgi boyunca kesikli oklar içeri doğru
 * ilerler; her kesik iç ucunda parlar → yön okunur. Merkez (iletişim metni)
 * boş bırakılır.
 */
const body = /* glsl */ `
  const float RAYS = 44.0;
  const float SWIRL = 0.85;
  const float PI = 3.14159265;

  vec4 figure(vec2 p) {
    vec2 size = uRes / uPx;
    vec2 d = p - 0.5 * size;
    float r = length(d) + 1e-3;
    float theta = atan(d.y, d.x);

    // Akış çizgisi koordinatı: log-sarmal. s tamsayıya yakın → çizgi üstü.
    float s = theta / (2.0 * PI) * RAYS + SWIRL * log(r) * RAYS / (2.0 * PI);
    float ws = fwidth(s);
    float line = 1.0 - smoothstep(0.5 * uPx, 0.5 * uPx + 1.0, abs(fract(s + 0.5) - 0.5) / max(ws, 1e-4));

    // Çizgi boyunca kesikler, zamanla içeri akar.
    float q = log(r) * 5.0 + uTime * 0.55;
    float dash = fract(q);
    float on = smoothstep(0.0, 0.04, dash) * (1.0 - smoothstep(0.52, 0.56, dash));
    float head = mix(0.35, 1.0, 1.0 - dash / 0.56);

    float inner = smoothstep(150.0, 320.0, r);
    float outer = 1.0 - smoothstep(0.55 * length(size), 0.75 * length(size), r);
    float alpha = line * on * head * inner * outer * 0.3;
    return vec4(ink(toneAt(p.y)), alpha);
  }
`;

export function FieldFigure() {
  return <ScreenFigure id="field" body={body} />;
}
