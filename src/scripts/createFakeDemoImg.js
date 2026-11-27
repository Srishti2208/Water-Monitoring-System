const sharp = require('sharp');
const path = require('path');

async function create() {
  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#334155"/>
    <text x="50%" y="35%" font-size="24" font-family="Arial" fill="#FFFFFF" text-anchor="middle" font-weight="bold">NON-WATER GOOGLE STOCK IMAGE</text>
    <text x="50%" y="50%" font-size="16" font-family="Arial" fill="#94A3B8" text-anchor="middle">Indoor Room / Downloaded Web Screenshot</text>
    <rect x="100" y="240" width="400" height="40" rx="8" fill="#7F1D1D" stroke="#EF4444" stroke-width="2"/>
    <text x="50%" y="66%" font-size="14" font-family="Arial" fill="#FCA5A5" text-anchor="middle" font-weight="bold">AI Rejection Test: IRRELEVANT_NON_WATER_IMAGE</text>
  </svg>`;

  const outPath = path.join(__dirname, '../../public/demo-images/fake_google_meme.jpg');
  await sharp(Buffer.from(svg)).jpeg().toFile(outPath);
  console.log('Created fake demo image at:', outPath);
}

create().catch(console.error);
