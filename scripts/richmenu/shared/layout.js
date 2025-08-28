// scripts/richmenu/shared/layout.js

// LINE Rich Menu 官方尺寸
//SIZE 通常代表 Rich Menu 畫布大小（例如 { width: 2500, height: 1686 }）
const SIZE = { width: 2500, height: 1686 };

// 將整數 total 平均切 parts 份（最後一份吃餘數）
function splitInt(total, parts) {
  const base = Math.floor(total / parts);
  const arr = Array(parts).fill(base);
  arr[parts - 1] += total - base * parts;
  return arr;
}

// 產生等寬欄位（回傳每欄 x 起點與 width）
function makeColumns({ left = 24, right = 24, gutter = 24, cols = 3 }) {
  const inner = SIZE.width - left - right - gutter * (cols - 1);
  const widths = splitInt(inner, cols);
  const xs = [];
  let cur = left;
  for (let i = 0; i < cols; i++) {
    xs.push(cur);
    cur += widths[i] + (i < cols - 1 ? gutter : 0);
  }
  return { xs, widths };
}

// 驗證點擊區域是否越界與是否重疊（回傳錯誤字串陣列）
//檢查每個區塊是否在畫布內、是否重疊、寬高是否為正數等
function validateAreas(areas) {
  const errs = [];
  for (const a of areas) {
    const { x, y, width, height } = a.bounds;
    if (x < 0 || y < 0 || x + width > SIZE.width || y + height > SIZE.height) {
      errs.push(`Out of bounds: ${JSON.stringify(a.bounds)}`);
    }
  }
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const A = areas[i].bounds, B = areas[j].bounds;
      const overlap = !(A.x + A.width <= B.x || B.x + B.width <= A.x || A.y + A.height <= B.y || B.y + B.height <= A.y);
      if (overlap) errs.push(`Overlap between #${i} and #${j}`);
    }
  }
  return errs;
}

module.exports = { SIZE, makeColumns, validateAreas };
