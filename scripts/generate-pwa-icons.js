const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create a valid PNG file using pure Node.js (zlib)
function createPng(width, height, drawPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon design renderer: Modern Dark Glassmorphic Indigo/Cyan Nexus Hexagon
function renderNexusIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded squircle / background
  const bgRadius = isMaskable ? w * 0.5 : w * 0.44;
  if (!isMaskable && dist > bgRadius) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Dark slate gradient base (#020617 to #0f172a)
  const normY = y / h;
  let r = Math.round(2 + normY * 13);
  let g = Math.round(6 + normY * 17);
  let b = Math.round(23 + normY * 30);
  let a = 255;

  // Inner vibrant Indigo/Cyan glow ring
  const ringRadius = w * 0.32;
  const ringThickness = w * 0.045;
  const ringDist = Math.abs(dist - ringRadius);

  if (ringDist < ringThickness) {
    const intensity = 1 - ringDist / ringThickness;
    // Gradient from Indigo (#6366f1) to Cyan (#06b6d4)
    const ringR = Math.round(99 + (x / w) * (-93));
    const ringG = Math.round(102 + (x / w) * 80);
    const ringB = Math.round(241 + (x / w) * (-29));

    r = Math.round(r * (1 - intensity) + ringR * intensity);
    g = Math.round(g * (1 - intensity) + ringG * intensity);
    b = Math.round(b * (1 - intensity) + ringB * intensity);
  }

  // Central Modern "N" / Chat Sparkle Symbol
  const nx = (x - cx) / (w * 0.22);
  const ny = (y - cy) / (h * 0.22);

  // Draw sleek geometric 'N' logo
  const inLeftBar = Math.abs(nx - (-0.6)) < 0.22 && Math.abs(ny) < 0.8;
  const inRightBar = Math.abs(nx - 0.6) < 0.22 && Math.abs(ny) < 0.8;
  const inDiag = Math.abs(ny - (nx * 1.33)) < 0.3 && Math.abs(nx) < 0.65 && Math.abs(ny) < 0.85;

  if (inLeftBar || inRightBar || inDiag) {
    // Pure vibrant white with cyan/indigo accent
    const accentR = Math.round(140 + (y / h) * 100);
    const accentG = Math.round(210 + (x / w) * 45);
    const accentB = 255;
    return [accentR, accentG, accentB, 255];
  }

  return [r, g, b, a];
}

// Generate Icons in public/icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons in', iconsDir);

const icon192 = createPng(192, 192, (x, y, w, h) => renderNexusIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);

const icon512 = createPng(512, 512, (x, y, w, h) => renderNexusIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);

const maskable192 = createPng(192, 192, (x, y, w, h) => renderNexusIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), maskable192);

const maskable512 = createPng(512, 512, (x, y, w, h) => renderNexusIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), maskable512);

// Also save apple-touch-icon.png
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), icon192);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), icon192);

console.log('Successfully generated all PWA icons (192x192, 512x512, maskable)!');
