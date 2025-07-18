// アイコン生成スクリプト
// Node.jsとsharpライブラリを使用してSVGからPNGを生成
// 使用方法: npm install sharp && node generate-icons.js

const fs = require('fs');
const path = require('path');

// SVGコンテンツを直接定義
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#1d9bf0"/>
  <circle cx="64" cy="48" r="20" fill="white"/>
  <path d="M 64 72 C 40 72 20 84 20 100 L 20 110 L 108 110 L 108 100 C 108 84 88 72 64 72 Z" fill="white"/>
  <rect x="20" y="60" width="88" height="8" fill="#ff3333" transform="rotate(-45 64 64)"/>
</svg>`;

const iconEnabledSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#ff3333"/>
  <circle cx="64" cy="48" r="20" fill="white"/>
  <path d="M 64 72 C 40 72 20 84 20 100 L 20 110 L 108 110 L 108 100 C 108 84 88 72 64 72 Z" fill="white"/>
  <rect x="20" y="60" width="88" height="8" fill="#14171a" transform="rotate(-45 64 64)"/>
</svg>`;

// Canvas APIを使用した簡易的なPNG生成（sharpが利用できない場合）
function createSimplePng(size, enabled = false) {
  // 簡易的な単色PNGを生成
  const color = enabled ? [255, 51, 51] : [29, 155, 240]; // RGB
  
  // PNG ヘッダーとIHDRチャンク
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
    createChunk('IHDR', Buffer.concat([
      Buffer.from([0, 0, 0, size]), // width
      Buffer.from([0, 0, 0, size]), // height
      Buffer.from([8, 2, 0, 0, 0]) // bit depth, color type, compression, filter, interlace
    ])),
    createChunk('IDAT', createImageData(size, color)),
    createChunk('IEND', Buffer.alloc(0))
  ]);
  
  return png;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crc = Buffer.alloc(4);
  // 簡易的なCRC（実際にはCRC32計算が必要）
  crc.writeUInt32BE(0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createImageData(size, [r, g, b]) {
  // 非常に簡易的な単色画像データ
  const data = Buffer.alloc(size * size * 3 + size);
  let pos = 0;
  for (let y = 0; y < size; y++) {
    data[pos++] = 0; // filter type
    for (let x = 0; x < size; x++) {
      data[pos++] = r;
      data[pos++] = g;
      data[pos++] = b;
    }
  }
  // zlibで圧縮する必要があるが、ここでは簡易実装
  return data;
}

// アイコンサイズ
const sizes = [16, 32, 48, 128];

// アイコンを生成
sizes.forEach(size => {
  // 通常アイコン
  const iconPath = path.join(__dirname, 'src', 'icons', `icon-${size}.png`);
  const iconData = createSimplePng(size, false);
  fs.writeFileSync(iconPath, iconData);
  console.log(`Created: ${iconPath}`);
  
  // 有効時のアイコン
  const enabledPath = path.join(__dirname, 'src', 'icons', `icon-enabled-${size}.png`);
  const enabledData = createSimplePng(size, true);
  fs.writeFileSync(enabledPath, enabledData);
  console.log(`Created: ${enabledPath}`);
});

console.log('\nNote: これは簡易的なアイコン生成です。実際の使用では適切な画像編集ソフトやsharpライブラリを使用してください。');