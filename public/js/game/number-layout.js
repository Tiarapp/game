// Places items inside an area without overlap, using measured text boxes.
const FAMILY = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
const ctx = document.createElement('canvas').getContext('2d');

function textBox(item, size) {
  ctx.font = `${item.fontWeight} ${size}px ${FAMILY}`;
  return { w: ctx.measureText(String(item.value)).width, h: size * 1.05 };
}

export function boxFor(item, size = item.fontSize) {
  const { w, h } = textBox(item, size);
  const r = (Math.abs(item.rotation) * Math.PI) / 180;
  return {
    w: w * Math.cos(r) + h * Math.sin(r) + 8,
    h: w * Math.sin(r) + h * Math.cos(r) + 8,
  };
}

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Returns { placed, dropped }. The target is always placed first and never dropped.
export function layoutItems(items, width, height, { margin = 6, gap = 6 } = {}) {
  const ordered = [...items].sort((a, b) => Number(b.isTarget) - Number(a.isTarget));
  const rects = [];
  const placed = [];
  let dropped = 0;

  for (const item of ordered) {
    let size = item.fontSize;
    let spot = null;
    // Shrink gradually if crowded; the target is allowed to shrink all the way down.
    const floor = item.isTarget ? 10 : 12;
    while (!spot && size >= floor) {
      const b = boxFor(item, size);
      const maxX = width - b.w - margin * 2;
      const maxY = height - b.h - margin * 2;
      if (maxX > 0 && maxY > 0) {
        for (let t = 0; t < 40; t++) {
          const r = {
            x: margin + Math.random() * maxX,
            y: margin + Math.random() * maxY,
            w: b.w + gap,
            h: b.h + gap,
          };
          if (!rects.some((o) => overlaps(r, o))) {
            spot = r;
            break;
          }
        }
      }
      if (!spot) size -= 4;
    }
    if (!spot) {
      if (item.isTarget) {
        // Fallback: area is tiny; place at a random point anyway so the target exists.
        const b = boxFor(item, 10);
        spot = { x: Math.max(0, Math.random() * (width - b.w)), y: Math.max(0, Math.random() * (height - b.h)), w: b.w, h: b.h };
        size = 10;
      } else {
        dropped++;
        continue;
      }
    }
    rects.push(spot);
    // Element is unrotated text-sized; centered on the reserved rotated box.
    const tb = textBox(item, size);
    const cx = spot.x + spot.w / 2, cy = spot.y + spot.h / 2;
    placed.push({ ...item, fontSize: size, x: cx - tb.w / 2, y: cy - tb.h / 2, w: tb.w, h: tb.h });
  }
  return { placed, dropped };
}
