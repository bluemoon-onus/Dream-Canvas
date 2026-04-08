import type { DreamCard } from "./types";

const W = 800;
const H = 1120;
const PAD = 56;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function exportCardAsPng(card: DreamCard): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 그라데이션 배경
  const [c1, c2, c3] = card.gradient;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 배경 이미지 (cover)
  if (card.backgroundImage) {
    try {
      const img = await loadImage(card.backgroundImage);
      const ratio = Math.max(W / img.width, H / img.height);
      const dw = img.width * ratio;
      const dh = img.height * ratio;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } catch {
      /* 무시 */
    }
  }

  // 하단 어두운 오버레이
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0)");
  overlay.addColorStop(0.5, "rgba(0,0,0,0.25)");
  overlay.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // 날짜 (우상단)
  const dateLabel = new Date(card.createdAt).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(dateLabel, W - PAD, PAD + 20);

  // 본문 (좌하단부터 위로 쌓기)
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  const maxW = W - PAD * 2;

  // 테마
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  const themeLines = wrap(ctx, card.theme, maxW);

  // 해석
  ctx.font = "400 28px system-ui, -apple-system, sans-serif";
  const interpLines = wrap(ctx, card.interpretation, maxW);

  // 태그 영역 높이 (한 줄 기준)
  const tagH = 50;

  // 총 높이 계산: 테마(64*lines) + gap + 해석(40*lines) + gap + 태그
  const themeH = themeLines.length * 64;
  const interpH = interpLines.length * 40;
  const totalH = themeH + 24 + interpH + 24 + tagH;
  let y = H - PAD - totalH;

  // 테마 그리기
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  for (const line of themeLines) {
    y += 56;
    ctx.fillText(line, PAD, y);
    y += 8;
  }

  y += 24;

  // 해석
  ctx.font = "400 28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  for (const line of interpLines) {
    y += 32;
    ctx.fillText(line, PAD, y);
    y += 8;
  }

  y += 24;

  // 태그
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  let tagX = PAD;
  for (const s of card.symbols) {
    const label = `#${s}`;
    const tw = ctx.measureText(label).width + 28;
    if (tagX + tw > W - PAD) break;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, tagX, y + 8, tw, 36, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, tagX + 14, y + 32);
    tagX += tw + 8;
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas toBlob 실패"))), "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x + w, y, x + w, y, r);
  ctx.closePath();
}
