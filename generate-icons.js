// 生成 PWA 图标 — 运行: node generate-icons.js
const fs = require('fs');
const { createCanvas } = require('canvas');

async function generate() {
    // 动态加载 canvas
    const sizes = [192, 512];

    for (const size of sizes) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // 红色圆角背景
        const r = size * 0.2;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        // 白色碗的图案 🍜
        const cx = size / 2;
        const cy = size * 0.55;
        const bowlW = size * 0.45;
        const bowlH = size * 0.35;

        // 碗身
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, bowlW, bowlH * 0.6, 0, Math.PI, 0);
        ctx.fill();

        // 碗口
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.06;
        ctx.beginPath();
        ctx.ellipse(cx, cy - bowlH * 0.15, bowlW, bowlH * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 热气
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.03;
        ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            const sx = cx + i * size * 0.12;
            const sy = cy - bowlH * 0.4;
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + size * 0.05, sy - size * 0.15, sx, sy - size * 0.25);
            ctx.stroke();
        }

        const buf = canvas.toBuffer('image/png');
        fs.writeFileSync(`images/icon-${size}.png`, buf);
        console.log(`✅ images/icon-${size}.png 已生成`);
    }
}

generate().catch(err => {
    console.error('请先安装依赖: npm install canvas');
    console.error(err.message);
});
