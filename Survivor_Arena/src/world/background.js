// =============================================
//  background.js — Latar: rumput + pohon & batu
// =============================================
import { spriteReady, drawSprite, frameForClip } from '../utils/assets.js';

export const WORLD_W = 1200;
export const WORLD_H = 1200;

export const OBSTACLES = [
  { x: 120, y: 150, r: 24, type: 'tree' },
  { x: 350, y: 100, r: 20, type: 'rock' },
  { x: 650, y: 180, r: 26, type: 'tree' },
  { x: 950, y: 140, r: 22, type: 'rock' },
  { x: 1050, y: 350, r: 28, type: 'tree' },
  { x: 820, y: 450, r: 18, type: 'rock' },
  { x: 500, y: 400, r: 25, type: 'tree' },
  { x: 200, y: 480, r: 20, type: 'rock' },
  { x: 100, y: 750, r: 24, type: 'tree' },
  { x: 380, y: 820, r: 22, type: 'rock' },
  { x: 700, y: 780, r: 28, type: 'tree' },
  { x: 1000, y: 720, r: 20, type: 'rock' },
  { x: 900, y: 1050, r: 26, type: 'tree' },
  { x: 600, y: 1100, r: 20, type: 'rock' },
  { x: 300, y: 1050, r: 25, type: 'tree' },
  { x: 150, y: 1000, r: 18, type: 'rock' },
  { x: 550, y: 650, r: 24, type: 'tree' },
  { x: 850, y: 880, r: 20, type: 'rock' },
  { x: 450, y: 250, r: 18, type: 'rock' },
  { x: 1100, y: 550, r: 25, type: 'tree' },
];

const PALETTE = {
  day: {
    grassBase: '#8BC34A',
    grassPatchA: '#7CB342',
    grassPatchB: '#9CCC65',
    grassSpeckle: ['#3B7D4F', '#63AB3F', '#2F5753'],
    treeCanopy: '#2E7D32',
    treeHighlight: '#66BB6A',
    treeShadow: 'rgba(27,94,32,0.3)',
    rockBase: '#9E9E9E',
    rockHighlight: 'rgba(189,189,189,0.7)',
    rockShadow: 'rgba(110,122,110,0.35)',
  },
  night: {
    grassBase: '#16281C',
    grassPatchA: '#12211a',
    grassPatchB: '#1d3324',
    grassSpeckle: ['#1c3a29', '#234a20', '#152a29'],
    treeCanopy: '#16321A',
    treeHighlight: 'rgba(58,107,71,0.5)',
    treeShadow: 'rgba(5,13,8,0.45)',
    rockBase: '#5B6670',
    rockHighlight: 'rgba(124,138,148,0.6)',
    rockShadow: 'rgba(10,20,15,0.5)',
  },
};

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrassSpeckle(ctx, palette) {
  const rand = mulberry32(1337);
  const count = 3000;
  for (let i = 0; i < count; i++) {
    const x = rand() * WORLD_W;
    const y = rand() * WORLD_H;
    const size = 1.5 + rand() * 2.5;
    const color = palette.grassSpeckle[Math.floor(rand() * palette.grassSpeckle.length)];
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, y, r, palette) {
  ctx.fillStyle = palette.treeShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.15, y + r * 0.3, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.treeCanopy;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.treeHighlight;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx, x, y, r, palette) {
  ctx.fillStyle = palette.rockShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.2, y + r * 0.25, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.rockBase;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x - r * 0.8, y - r, x, y - r * 0.9);
  ctx.quadraticCurveTo(x + r, y - r * 0.7, x + r * 0.9, y);
  ctx.quadraticCurveTo(x + r, y + r * 0.7, x, y + r * 0.75);
  ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.7, x - r, y);
  ctx.fill();

  ctx.fillStyle = palette.rockHighlight;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

const cache = { day: null, night: null };

function buildCache(isNight) {
  const key = isNight ? 'night' : 'day';
  const palette = PALETTE[key];
  const off = document.createElement('canvas');
  off.width = WORLD_W;
  off.height = WORLD_H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = palette.grassBase;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  drawGrassSpeckle(ctx, palette);

  ctx.globalAlpha = 0.5;
  const patches = [
    [100, 100, 45, 25, palette.grassPatchA], [350, 200, 50, 30, palette.grassPatchB],
    [700, 150, 40, 22, palette.grassPatchA], [1050, 250, 48, 28, palette.grassPatchB],
    [200, 450, 42, 24, palette.grassPatchB], [600, 500, 55, 32, palette.grassPatchA],
    [950, 550, 45, 26, palette.grassPatchA], [1100, 850, 50, 30, palette.grassPatchB],
    [150, 800, 48, 28, palette.grassPatchA], [450, 900, 42, 25, palette.grassPatchB],
    [750, 1050, 52, 30, palette.grassPatchA], [1000, 1100, 40, 22, palette.grassPatchB],
    [500, 150, 38, 20, palette.grassPatchA], [850, 350, 44, 26, palette.grassPatchB],
    [300, 650, 46, 28, palette.grassPatchA], [700, 750, 40, 24, palette.grassPatchB],
  ];
  for (const [x, y, rx, ry, color] of patches) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const o of OBSTACLES) {
    if (o.type === 'rock') {
      if (spriteReady('rock')) {
        drawSprite(ctx, 'rock', o.x, o.y, o.r * 2.6);
      } else {
        drawRock(ctx, o.x, o.y, o.r, palette);
      }
    } else if (o.type === 'tree' && !spriteReady('tree')) {
      drawTree(ctx, o.x, o.y, o.r, palette);
    }
  }

  if (isNight) {
    ctx.fillStyle = '#EAF2FF';
    const rand = mulberry32(777);
    for (let i = 0; i < 50; i++) {
      const x = rand() * WORLD_W;
      const y = rand() * WORLD_H;
      ctx.globalAlpha = 0.5 + rand() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + rand() * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  cache[key] = off;
}

export function prebuildBackgrounds() {
  if (!cache.day) buildCache(false);
  if (!cache.night) buildCache(true);
}

export function drawBackground(ctx, isNight, camX, camY, viewW, viewH) {
  const key = isNight ? 'night' : 'day';
  if (!cache[key]) buildCache(isNight);
  
  // Cukup gambar latar cache dunia (rumput, pohon, batu, bintang)
  ctx.drawImage(cache[key], camX, camY, viewW, viewH, camX, camY, viewW, viewH);
  
  drawTreesAnimated(ctx, isNight);
}

function drawTreesAnimated(ctx, isNight) {
  if (!spriteReady('tree')) return;
  const t = performance.now() / 1000;
  for (const o of OBSTACLES) {
    if (o.type !== 'tree') continue;
    const frame = frameForClip('tree', t + o.x * 0.03, 8, 'pingpong').index;
    drawSprite(ctx, 'tree', o.x, o.y - o.r * 0.6, o.r * 4.0, frame);
  }
}