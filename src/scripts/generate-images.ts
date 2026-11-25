import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.join(process.cwd(), 'public', 'demo-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

interface ImageSpec {
  name: string;
  label: string;
  bgColor: string;
  accentColor: string;
  description: string;
  pollutionType: string;
}

const images: ImageSpec[] = [
  {
    name: 'foam.jpg',
    label: 'Toxic Chemical Foam',
    bgColor: '#1e293b',
    accentColor: '#f8fafc',
    description: 'Thick white effluent foam floating on water surface',
    pollutionType: 'foam'
  },
  {
    name: 'sewage_inflow.jpg',
    label: 'Sewage Inflow Pipe',
    bgColor: '#292524',
    accentColor: '#78716c',
    description: 'Blackwater discharge conduit spilling into wetland buffer',
    pollutionType: 'sewage_inflow'
  },
  {
    name: 'algal_bloom.jpg',
    label: 'Eutrophic Algal Bloom',
    bgColor: '#064e3b',
    accentColor: '#34d399',
    description: 'Dense green microcystis scum coating shoreline',
    pollutionType: 'algal_bloom'
  },
  {
    name: 'solid_waste.jpg',
    label: 'Solid Waste Dumping',
    bgColor: '#3f3f46',
    accentColor: '#fbbf24',
    description: 'Plastic bottles, polythene, and domestic refuse accumulation',
    pollutionType: 'solid_waste'
  },
  {
    name: 'construction_debris.jpg',
    label: 'Construction Debris Dump',
    bgColor: '#44403c',
    accentColor: '#fdba74',
    description: 'Concrete chunks, soil fill, and demolition rubble encroaching lake bed',
    pollutionType: 'construction_debris'
  },
  {
    name: 'oil_sheen.jpg',
    label: 'Oil Sheen and Hydrocarbons',
    bgColor: '#18181b',
    accentColor: '#c084fc',
    description: 'Iridescent petrol film floating near storm drain',
    pollutionType: 'oil_sheen'
  },
  {
    name: 'dead_fish.jpg',
    label: 'Fish Mortality Incident',
    bgColor: '#1c1917',
    accentColor: '#f87171',
    description: 'Severe hypoxic event with deceased freshwater fish',
    pollutionType: 'dead_fish'
  },
  {
    name: 'discoloration.jpg',
    label: 'Industrial Discoloration',
    bgColor: '#311042',
    accentColor: '#e879f9',
    description: 'Turbid purplish dye discharge from small scale dyeing units',
    pollutionType: 'discoloration'
  },
  {
    name: 'clean_water.jpg',
    label: 'Restored Clean Water',
    bgColor: '#0c4a6e',
    accentColor: '#38bdf8',
    description: 'Aerated, transparent water with active riparian vegetation',
    pollutionType: 'clean_water'
  },
  {
    name: 'visarjan_debris.jpg',
    label: 'Festival Visarjan Waste',
    bgColor: '#451a03',
    accentColor: '#f59e0b',
    description: 'Plaster of Paris fragments, synthetic paint, and withered flowers',
    pollutionType: 'solid_waste'
  }
];

async function generateImages() {
  for (const item of images) {
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${item.bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad)" />
        <circle cx="400" cy="220" r="110" fill="${item.accentColor}" opacity="0.15" />
        <circle cx="400" cy="220" r="80" fill="${item.accentColor}" opacity="0.3" />
        <rect x="60" y="40" width="680" height="520" rx="16" fill="none" stroke="${item.accentColor}" stroke-width="2" opacity="0.4" />
        
        <text x="400" y="210" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
          JalDrishti Evidence Photo
        </text>
        <text x="400" y="250" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="${item.accentColor}" text-anchor="middle">
          [ ${item.label.toUpperCase()} ]
        </text>
        
        <rect x="100" y="340" width="600" height="150" rx="12" fill="#0f172a" opacity="0.8" />
        <text x="400" y="380" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">
          Category: ${item.pollutionType}
        </text>
        <text x="400" y="420" font-family="Arial, sans-serif" font-size="15" fill="#e2e8f0" text-anchor="middle">
          "${item.description}"
        </text>
        <text x="400" y="460" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">
          Geo-tagged &amp; Perceptual Hash Verified • Lake Quality Observation Unit
        </text>
      </svg>
    `;

    const filePath = path.join(outputDir, item.name);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(filePath);
    console.log(`Generated: ${filePath}`);
  }
}

generateImages().catch(console.error);
