import type { BoundingBox, CompareOptions, CompareResult } from "@/types/compare";

const DEFAULT_OPTIONS: CompareOptions = {
  threshold: 0.1,
  includeAntiAliasing: true,
  highlightColor: { r: 255, g: 0, b: 0, a: 255 },
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export async function loadImageFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function findBoundingBoxes(
  mask: Uint8Array,
  width: number,
  height: number,
): BoundingBox[] {
  const visited = new Uint8Array(width * height);
  const boxes: BoundingBox[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx] || visited[idx]) continue;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      const stack = [idx];
      visited[idx] = 1;

      while (stack.length) {
        const current = stack.pop()!;
        const cx = current % width;
        const cy = Math.floor(current / width);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const neighbors = [
          current - 1,
          current + 1,
          current - width,
          current + width,
        ];

        for (const neighbor of neighbors) {
          const nx = neighbor % width;
          const ny = Math.floor(neighbor / width);
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (!mask[neighbor] || visited[neighbor]) continue;
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }

      if (maxX - minX > 2 || maxY - minY > 2) {
        boxes.push({
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        });
      }
    }
  }

  return boxes.slice(0, 50);
}

export async function compareImages(
  imageA: string,
  imageB: string,
  options: Partial<CompareOptions> = {},
): Promise<CompareResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [imgA, imgB] = await Promise.all([loadImage(imageA), loadImage(imageB)]);

  const width = Math.max(imgA.naturalWidth, imgB.naturalWidth);
  const height = Math.max(imgA.naturalHeight, imgB.naturalHeight);

  const canvasA = document.createElement("canvas");
  const canvasB = document.createElement("canvas");
  canvasA.width = width;
  canvasA.height = height;
  canvasB.width = width;
  canvasB.height = height;

  const ctxA = canvasA.getContext("2d", { willReadFrequently: true });
  const ctxB = canvasB.getContext("2d", { willReadFrequently: true });
  if (!ctxA || !ctxB) throw new Error("Canvas not supported");

  ctxA.fillStyle = "#ffffff";
  ctxA.fillRect(0, 0, width, height);
  ctxB.fillStyle = "#ffffff";
  ctxB.fillRect(0, 0, width, height);

  ctxA.drawImage(imgA, 0, 0);
  ctxB.drawImage(imgB, 0, 0);

  const dataA = ctxA.getImageData(0, 0, width, height);
  const dataB = ctxB.getImageData(0, 0, width, height);

  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext("2d");
  if (!diffCtx) throw new Error("Canvas not supported");

  const diffData = diffCtx.createImageData(width, height);
  const mask = new Uint8Array(width * height);

  let changedPixels = 0;
  const totalPixels = width * height;
  const threshold = opts.threshold * 255 * Math.sqrt(3);

  for (let i = 0; i < dataA.data.length; i += 4) {
    const r1 = dataA.data[i];
    const g1 = dataA.data[i + 1];
    const b1 = dataA.data[i + 2];
    const a1 = dataA.data[i + 3];

    const r2 = dataB.data[i];
    const g2 = dataB.data[i + 1];
    const b2 = dataB.data[i + 2];
    const a2 = dataB.data[i + 3];

    const dist = colorDistance(r1, g1, b1, r2, g2, b2);
    const alphaDiff = Math.abs(a1 - a2);
    const isDifferent =
      dist > threshold || (opts.includeAntiAliasing && alphaDiff > 30);

    if (isDifferent) {
      changedPixels++;
      const pixelIndex = i / 4;
      mask[pixelIndex] = 1;
      diffData.data[i] = opts.highlightColor.r;
      diffData.data[i + 1] = opts.highlightColor.g;
      diffData.data[i + 2] = opts.highlightColor.b;
      diffData.data[i + 3] = 200;
    } else {
      const gray = Math.round((r1 + g1 + b1) / 3);
      diffData.data[i] = gray;
      diffData.data[i + 1] = gray;
      diffData.data[i + 2] = gray;
      diffData.data[i + 3] = 40;
    }
  }

  diffCtx.putImageData(diffData, 0, 0);

  const boundingBoxes = findBoundingBoxes(mask, width, height);

  return {
    diffPercentage: (changedPixels / totalPixels) * 100,
    changedPixels,
    totalPixels,
    width,
    height,
    diffDataUrl: diffCanvas.toDataURL("image/png"),
    boundingBoxes,
  };
}

export function calculatePercentage(changed: number, total: number): number {
  if (total === 0) return 0;
  return (changed / total) * 100;
}

export function generateSummary(result: CompareResult): string {
  const pct = result.diffPercentage.toFixed(1);
  if (result.diffPercentage < 0.5) {
    return `${pct}% of pixels changed — images are nearly identical.`;
  }
  if (result.boundingBoxes.length > 0) {
    const regions = result.boundingBoxes.length;
    return `${pct}% of the page changed across ${regions} distinct region${regions === 1 ? "" : "s"}. Review highlighted areas in red.`;
  }
  return `${pct}% visual difference detected between the two images.`;
}

export function exportReportMetadata(
  result: CompareResult,
  meta: Record<string, unknown>,
) {
  return {
    ...meta,
    diffPercentage: result.diffPercentage,
    changedPixels: result.changedPixels,
    totalPixels: result.totalPixels,
    width: result.width,
    height: result.height,
    boundingBoxCount: result.boundingBoxes.length,
    boundingBoxes: result.boundingBoxes,
    timestamp: new Date().toISOString(),
  };
}
