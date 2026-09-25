export interface Pt {
  x: number;
  y: number;
}

/**
 * Verilen kontrol noktalarından kesintisiz, pürüzsüz bir Catmull-Rom / Bezier SVG eğri yolu üretir.
 */
export function buildProofPath(points: Pt[]): string {
  if (points.length < 2) return "";

  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

/**
 * Verilen bölüm Y koordinatları arasında hafif salınım (sway) yaparak
 * checkpoint noktalarından geçen pürüzsüz nokta listesi döner.
 */
export function checkpointPoints(
  yList: number[],
  totalHeight: number,
  baseX = 12,
  sway = 4,
): Pt[] {
  const sortedY = [...new Set(yList)].sort((a, b) => a - b);
  const result: Pt[] = [{ x: baseX, y: 0 }];

  let currentY = 0;
  let direction = 1;

  for (let i = 0; i < sortedY.length; i++) {
    const targetY = sortedY[i];
    if (targetY > currentY + 40) {
      // Ara salınım noktası
      const midY = (currentY + targetY) / 2;
      result.push({ x: baseX + direction * sway, y: midY });
      direction *= -1;
    }
    // Checkpoint noktası: tam baseX üzerinde
    result.push({ x: baseX, y: targetY });
    currentY = targetY;
  }

  if (totalHeight > currentY + 40) {
    const midY = (currentY + totalHeight) / 2;
    result.push({ x: baseX + direction * sway, y: midY });
  }
  result.push({ x: baseX, y: totalHeight });

  return result;
}
