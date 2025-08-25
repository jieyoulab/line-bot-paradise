#!/usr/bin/env node
// scripts/tools/compressImages.js
// Node.js v20+，imagemin v8+ 是 ESM-only，要用 import()

const fs = require('fs');
const path = require('path');

// 動態 import（避免 ERR_REQUIRE_ESM）
async function loadImagemin() {
  const { default: imagemin } = await import('imagemin');
  const { default: imageminPngquant } = await import('imagemin-pngquant');
  const { default: imageminMozjpeg } = await import('imagemin-mozjpeg');
  return { imagemin, imageminPngquant, imageminMozjpeg };
}

const SRC_DIR = path.resolve(__dirname, '../../public/richmenu');
const OUT_DIR = path.resolve(__dirname, '../../dist/richmenu');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function compressImage(srcPath, outPath, plugins) {
  const buf = fs.readFileSync(srcPath);
  const beforeKB = (buf.length / 1024).toFixed(1);

  const { imagemin } = await loadImagemin();
  const compressed = await imagemin.buffer(buf, { plugins });

  const afterKB = (compressed.length / 1024).toFixed(1);

  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, compressed);

  console.log(`✅ ${path.relative(SRC_DIR, srcPath)} ${beforeKB}KB → ${afterKB}KB`);
}

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) results = results.concat(walk(filePath));
    else results.push(filePath);
  }
  return results;
}

(async () => {
  const { imageminPngquant, imageminMozjpeg } = await loadImagemin();

  const files = walk(SRC_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));
  console.log(`🔍 找到 ${files.length} 張圖片，開始壓縮…`);

  for (const f of files) {
    const relPath = path.relative(SRC_DIR, f);
    const outPath = path.join(OUT_DIR, relPath);

    const ext = path.extname(f).toLowerCase();
    const plugins = ext === '.png'
      ? [imageminPngquant({ quality: [0.6, 0.8] })]
      : [imageminMozjpeg({ quality: 75 })];

    await compressImage(f, outPath, plugins);
  }

  console.log(`🎉 壓縮完成，檔案已輸出到 dist/richmenu/`);
})();
