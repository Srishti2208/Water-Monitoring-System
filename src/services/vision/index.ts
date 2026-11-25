import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { computeDHash } from '../dhash';

export type PollutionLabel =
  | 'foam'
  | 'algal_bloom'
  | 'solid_waste'
  | 'construction_debris'
  | 'oil_sheen'
  | 'sewage_inflow'
  | 'discoloration'
  | 'dead_fish';

export interface VisionAnalysisResult {
  labels: PollutionLabel[];
  severity: number; // 1-5
  confidence: number; // 0-1
  notes: string;
  provider: 'mock' | 'gemini';
}

export interface IVisionService {
  analyzeWaterImage(imagePathOrBuffer: string | Buffer): Promise<VisionAnalysisResult>;
}

/**
 * Deterministic Mock Vision Provider:
 * Infers labels and severity from image filename or dHash characteristics.
 * Ensures offline repeatability for the hackathon demo.
 */
export class MockVisionProvider implements IVisionService {
  async analyzeWaterImage(imageInput: string | Buffer): Promise<VisionAnalysisResult> {
    const filename = typeof imageInput === 'string' ? path.basename(imageInput).toLowerCase() : '';

    if (filename.includes('foam')) {
      return {
        labels: ['foam', 'discoloration'],
        severity: 4,
        confidence: 0.94,
        notes: 'Dense toxic chemical foam crust detected along weir outflow. High surfactant concentration indicated.',
        provider: 'mock',
      };
    }
    if (filename.includes('sewage')) {
      return {
        labels: ['sewage_inflow', 'discoloration'],
        severity: 5,
        confidence: 0.96,
        notes: 'Untreated domestic blackwater discharge observed with active septic turbidity and hydrogen sulfide odor cues.',
        provider: 'mock',
      };
    }
    if (filename.includes('algal') || filename.includes('bloom')) {
      return {
        labels: ['algal_bloom'],
        severity: 3,
        confidence: 0.89,
        notes: 'Hyper-eutrophic cyanobacterial / microcystis bloom covering nearshore water column.',
        provider: 'mock',
      };
    }
    if (filename.includes('debris') || filename.includes('construction')) {
      return {
        labels: ['construction_debris', 'solid_waste'],
        severity: 3,
        confidence: 0.91,
        notes: 'Encroachment with concrete rubble and excavation silt reducing lake buffer zone.',
        provider: 'mock',
      };
    }
    if (filename.includes('oil') || filename.includes('sheen')) {
      return {
        labels: ['oil_sheen'],
        severity: 4,
        confidence: 0.87,
        notes: 'Hydrocarbon sheen with interference color bands spreading across shoreline surface.',
        provider: 'mock',
      };
    }
    if (filename.includes('dead_fish') || filename.includes('fish')) {
      return {
        labels: ['dead_fish', 'sewage_inflow'],
        severity: 5,
        confidence: 0.98,
        notes: 'Severe hypoxia / acute toxicity event: multiple dead freshwater fish floating along littoral zone.',
        provider: 'mock',
      };
    }
    if (filename.includes('visarjan') || filename.includes('festival')) {
      return {
        labels: ['solid_waste', 'discoloration'],
        severity: 4,
        confidence: 0.92,
        notes: 'Post-festival idol immersion debris: Plaster of Paris fragments, synthetic pigments, and non-biodegradable garlands.',
        provider: 'mock',
      };
    }
    if (filename.includes('solid_waste') || filename.includes('waste')) {
      return {
        labels: ['solid_waste'],
        severity: 3,
        confidence: 0.93,
        notes: 'Accumulation of unsegregated plastic containers, polythene bags, and floating debris.',
        provider: 'mock',
      };
    }
    if (filename.includes('clean')) {
      return {
        labels: [],
        severity: 1,
        confidence: 0.95,
        notes: 'Water surface appears clear of visible surface scum or floating debris. Riparian edge stable.',
        provider: 'mock',
      };
    }

    // Hash-based deterministic derivation for generic user-uploaded files
    try {
      const hash = await computeDHash(imageInput);
      const hashNum = parseInt(hash.slice(0, 4), 16);
      const labelPool: PollutionLabel[] = [
        'foam',
        'solid_waste',
        'algal_bloom',
        'sewage_inflow',
        'discoloration',
      ];
      const selectedLabel = labelPool[hashNum % labelPool.length];
      const severity = ((hashNum >> 4) % 4) + 2; // 2 to 5

      return {
        labels: [selectedLabel],
        severity,
        confidence: 0.88,
        notes: `Automated detection: ${selectedLabel.replace('_', ' ')} verified via perceptual feature clustering.`,
        provider: 'mock',
      };
    } catch {
      return {
        labels: ['solid_waste'],
        severity: 3,
        confidence: 0.85,
        notes: 'Surface contamination detected with suspended solids.',
        provider: 'mock',
      };
    }
  }
}

/**
 * Gemini Multimodal Vision Provider
 */
export class GeminiVisionProvider implements IVisionService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  async analyzeWaterImage(imageInput: string | Buffer): Promise<VisionAnalysisResult> {
    let buffer: Buffer;
    let mimeType = 'image/jpeg';

    if (typeof imageInput === 'string') {
      let resolvedPath = imageInput;
      if (imageInput.startsWith('/')) {
        resolvedPath = path.join(process.cwd(), 'public', imageInput.replace(/^\//, ''));
      }
      buffer = await fs.promises.readFile(resolvedPath);
      if (resolvedPath.endsWith('.png')) mimeType = 'image/png';
      if (resolvedPath.endsWith('.webp')) mimeType = 'image/webp';
    } else {
      buffer = imageInput;
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert environmental water quality inspection AI for the JalDrishti civic platform.
Analyze this lake/waterbody evidence photo for pollution.

Allowed labels (choose up to 3):
- "foam"
- "algal_bloom"
- "solid_waste"
- "construction_debris"
- "oil_sheen"
- "sewage_inflow"
- "discoloration"
- "dead_fish"

Severity Rubric (integer 1 to 5):
1 = Trace / minor anomaly, natural baseline
2 = Mild localized contamination
3 = Clearly polluted, visibly affects waterbody aesthetics and usage
4 = Significant environmental degradation (foaming, heavy dumping, oily film)
5 = Severe public health hazard (dead fish kill, raw blackwater sewage gush, toxic industrial sludge)

Return ONLY a valid JSON object matching this TypeScript structure:
{
  "labels": string[],
  "severity": number,
  "confidence": number,
  "notes": string
}
Do not include markdown backticks or commentary outside the JSON.
`;

    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };

    const response = await model.generateContent([prompt, imagePart]);
    const responseText = response.response.text().trim();
    const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(cleanJson);
    return {
      labels: parsed.labels || ['solid_waste'],
      severity: Math.min(5, Math.max(1, Math.round(parsed.severity || 3))),
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.9)),
      notes: parsed.notes || 'Waterbody condition analyzed via multimodal inspection.',
      provider: 'gemini',
    };
  }
}

/**
 * Factory helper to get active Vision Service instance
 */
export function getVisionService(): IVisionService {
  const provider = (process.env.VISION_PROVIDER || 'mock').toLowerCase();
  const isDemo = process.env.DEMO_MODE !== 'false';

  if (!isDemo && provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return new GeminiVisionProvider();
  }

  return new MockVisionProvider();
}
