const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    dpi: 96
  });
  const pngData = resvg.render().asPng();
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated ${outPath}`);
}

console.log('Done. Generated icon-16.png, icon-32.png, icon-48.png, icon-128.png');
