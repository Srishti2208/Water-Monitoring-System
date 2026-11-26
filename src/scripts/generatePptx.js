const pptxgen = require('pptxgenjs');
const path = require('path');

async function createDeck() {
  const pres = new pptxgen();

  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Srishti A';
  pres.company = 'Dayananda Sagar University';
  pres.title = 'JalDrishti — Lake & Water Quality Governance Platform';
  pres.subject = 'Civic-Tech, Multimodal Gen AI, and Environmental Water Governance';

  // THEME COLORS
  const BG_DARK = '0B1120';
  const CARD_BG = '1E293B';
  const ACCENT_CYAN = '38BDF8';
  const ACCENT_TEAL = '2DD4BF';
  const ACCENT_PURPLE = 'A855F7';
  const ACCENT_ROSE = 'F43F5E';
  const ACCENT_AMBER = 'F59E0B';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';

  // Helper to add base slide with header/footer
  function createSlide(slideTitle, category = 'JalDrishti • Dayananda Sagar University') {
    const slide = pres.addSlide();
    slide.background = { color: BG_DARK };

    // Top Category Header
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.4,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: ACCENT_CYAN,
      bold: true,
      charSpacing: 2
    });

    // Main Slide Heading
    slide.addText(slideTitle, {
      x: 0.8,
      y: 0.7,
      w: 11.5,
      h: 0.6,
      fontSize: 24,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true
    });

    // Footer
    slide.addText('Srishti A • Dayananda Sagar University (DSU) • Bengaluru', {
      x: 0.8,
      y: 7.0,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      color: TEXT_MUTED
    });

    return slide;
  }

  // ==================== SLIDE 1: TITLE ====================
  {
    const s = pres.addSlide();
    s.background = { color: BG_DARK };

    s.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.2,
      w: 3.8,
      h: 0.35,
      fill: { color: '164E63' },
      line: { color: ACCENT_CYAN, width: 1 }
    });
    s.addText('🌿 CIVIC-TECH & GENERATIVE AI', {
      x: 0.9,
      y: 1.25,
      w: 3.6,
      h: 0.25,
      fontSize: 10,
      color: ACCENT_CYAN,
      bold: true
    });

    s.addText('JalDrishti (जलदृष्टि)', {
      x: 0.8,
      y: 1.8,
      w: 11.5,
      h: 1.0,
      fontSize: 44,
      fontFace: 'Arial',
      color: ACCENT_CYAN,
      bold: true
    });

    s.addText('Autonomous Lake & Water Quality Governance Platform', {
      x: 0.8,
      y: 2.8,
      w: 11.5,
      h: 0.6,
      fontSize: 22,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true
    });

    s.addText(
      'An end-to-end civic ecosystem combining Multimodal Generative AI (Gemini 1.5), client-side EXIF GPS verification, automated statutory legal notices under the Water Act 1974, and citizen-verified remediation.',
      {
        x: 0.8,
        y: 3.6,
        w: 10.5,
        h: 0.9,
        fontSize: 13,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        lineSpacing: 20
      }
    );

    // Presenter Info Card
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 4.8,
      w: 7.5,
      h: 1.6,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    s.addText('LEAD DEVELOPER & PRESENTER', {
      x: 1.1,
      y: 5.0,
      w: 4.0,
      h: 0.25,
      fontSize: 9,
      color: TEXT_MUTED,
      bold: true
    });
    s.addText('Srishti A', {
      x: 1.1,
      y: 5.3,
      w: 4.0,
      h: 0.4,
      fontSize: 18,
      color: TEXT_WHITE,
      bold: true
    });

    s.addText('INSTITUTION & DEPARTMENT', {
      x: 4.5,
      y: 5.0,
      w: 3.5,
      h: 0.25,
      fontSize: 9,
      color: TEXT_MUTED,
      bold: true
    });
    s.addText('Dayananda Sagar University (DSU)\nBengaluru, Karnataka', {
      x: 4.5,
      y: 5.3,
      w: 3.5,
      h: 0.8,
      fontSize: 13,
      color: ACCENT_CYAN,
      bold: true
    });
  }

  // ==================== SLIDE 2: PROBLEM STATEMENT ====================
  {
    const s = createSlide("Bengaluru's Broken Water Governance Loop", "Problem Statement");

    const issues = [
      {
        num: '01',
        title: 'Chronic Effluent Influx',
        color: ACCENT_ROSE,
        body: 'Over 1,400 MLD of untreated sewage enters Bengaluru lakes. Bellandur & Varthur regularly erupt in toxic chemical foam and hypoxic mass fish mortality events.'
      },
      {
        num: '02',
        title: 'Unverified Grievances',
        color: ACCENT_AMBER,
        body: 'Current portals accept manual, unverified text with zero camera GPS validation. Civic desks are overwhelmed with duplicate spam or unverifiable reports.'
      },
      {
        num: '03',
        title: 'Rampant Ghost Closures',
        color: ACCENT_CYAN,
        body: 'Municipal contractors mark grievance tickets "Resolved" on paper to meet administrative quotas without physical desiltation. Citizens have zero power to verify.'
      }
    ];

    issues.forEach((item, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 3.6,
        h: 4.6,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      s.addText(item.num, {
        x: x + 0.3,
        y: 2.1,
        w: 1.0,
        h: 0.5,
        fontSize: 28,
        color: item.color,
        bold: true
      });
      s.addText(item.title, {
        x: x + 0.3,
        y: 2.7,
        w: 3.0,
        h: 0.6,
        fontSize: 16,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(item.body, {
        x: x + 0.3,
        y: 3.4,
        w: 3.0,
        h: 2.6,
        fontSize: 12,
        color: TEXT_MUTED,
        lineSpacing: 18
      });
    });
  }

  // ==================== SLIDE 3: OBJECTIVES ====================
  {
    const s = createSlide('Objectives of the JalDrishti Platform', 'Project Objectives');

    const objs = [
      {
        title: 'Tamper-Proof Reporting',
        body: 'Extract camera hardware EXIF GPS & timestamps client-side with exifr; disallow manual coordinate entry.'
      },
      {
        title: 'Multimodal AI Triaging',
        body: 'Automate visual detection of foam, sewage, algae, and fish kills via Gemini 1.5 Flash with structured 1–5 severity rubrics.'
      },
      {
        title: 'Dynamic Health Index',
        body: 'Compute a mathematical 0–100 Lake Health Score factoring 90-day exponential temporal decay (lambda = 14d) and physical readings.'
      },
      {
        title: 'Statutory Enforcement',
        body: 'Auto-generate formal legal notices under Section 24 of the Water Act 1974, with 15-minute background SLA escalations and citizen sign-off.'
      }
    ];

    objs.forEach((o, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.8;
      const y = 1.8 + row * 2.5;

      s.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.5,
        h: 2.2,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      s.addText(`0${idx + 1}. ${o.title}`, {
        x: x + 0.3,
        y: y + 0.3,
        w: 4.9,
        h: 0.4,
        fontSize: 15,
        color: ACCENT_TEAL,
        bold: true
      });
      s.addText(o.body, {
        x: x + 0.3,
        y: y + 0.8,
        w: 4.9,
        h: 1.1,
        fontSize: 12,
        color: TEXT_MUTED,
        lineSpacing: 18
      });
    });
  }

  // ==================== SLIDE 4: GEN AI & LLM HIGHLIGHT ====================
  {
    const s = createSlide('Generative AI & Multimodal LLM Architecture', 'Core AI Innovation');

    const aiFeatures = [
      {
        title: '01. Multimodal Vision Reasoning',
        sub: 'Gemini 1.5 Flash Vision Model',
        body: 'Performs zero-shot environmental scene analysis over high-res photos to identify foam, algal bloom, solid waste, sewage outfalls, and fish kills in complex conditions.'
      },
      {
        title: '02. Structured JSON Output',
        sub: 'Deterministic Calibration',
        body: 'Enforces schema generation returning: labels[], severity (1–5), confidence (0–1), and forensic environmental notes, eliminating hallucination in civic processing.'
      },
      {
        title: '03. Gen-AI Legal Notice Drafting',
        sub: 'Statutory Water Act Notices',
        body: 'Synthesizes verified evidence, citizen readings, and GPS coordinates into legally enforceable notices citing Section 24 of the Water Act, 1974 for BBMP & KSPCB.'
      }
    ];

    aiFeatures.forEach((f, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 3.6,
        h: 4.6,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: ACCENT_PURPLE, width: 1.5 }
      });

      s.addText(f.title, {
        x: x + 0.3,
        y: 2.1,
        w: 3.0,
        h: 0.4,
        fontSize: 14,
        color: ACCENT_PURPLE,
        bold: true
      });
      s.addText(f.sub, {
        x: x + 0.3,
        y: 2.6,
        w: 3.0,
        h: 0.4,
        fontSize: 12,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(f.body, {
        x: x + 0.3,
        y: 3.1,
        w: 3.0,
        h: 2.9,
        fontSize: 11.5,
        color: TEXT_MUTED,
        lineSpacing: 18
      });
    });
  }

  // ==================== SLIDE 5: GEN AI PROMPT & REASONING FLOW ====================
  {
    const s = createSlide('Environmental System Prompt & Context Engine', 'Generative AI Pipeline');

    // Left Code Box
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 5.6,
      h: 4.6,
      rectRadius: 0.1,
      fill: { color: '070D18' },
      line: { color: '1E293B', width: 1 }
    });

    s.addText(
      '// SYSTEM PROMPT FOR GEMINI 1.5 FLASH\n\n' +
      'You are an expert limnologist. Analyze the water body image\n' +
      'and return strictly valid JSON matching:\n' +
      '{\n' +
      '  "labels": ["foam"|"algae"|"waste"|"sewage"|"dead_fish"],\n' +
      '  "severity": number, // 1 (trace) to 5 (severe hazard)\n' +
      '  "confidence": number, // 0.0 to 1.0\n' +
      '  "notes": string // concise environmental reasoning\n' +
      '}\n\n' +
      '// SEVERITY RUBRIC:\n' +
      '- Level 1: Minor floating leaves or slight turbidity\n' +
      '- Level 3: Active sewage outfall pipe, plastic accumulation\n' +
      '- Level 5: Toxic chemical froth or floating dead fish',
      {
        x: 1.0,
        y: 2.0,
        w: 5.2,
        h: 4.2,
        fontSize: 10,
        fontFace: 'Courier New',
        color: ACCENT_CYAN,
        lineSpacing: 15
      }
    );

    // Right Explanation Cards
    const cards = [
      {
        title: 'Runoff Disambiguation',
        body: 'Cross-checks Open-Meteo 72h precipitation (>=20mm) with image analysis to avoid penalizing natural stormwater runoff.'
      },
      {
        title: 'Zero-Shot Edge Generalization',
        body: 'Handles variable lighting, angle reflections, and dirty camera lenses without requiring multi-gigabyte custom CNN training datasets.'
      },
      {
        title: 'Offline Provider Decoupling',
        body: 'Built on a provider interface: defaults seamlessly to a deterministic Mock Provider when offline (DEMO_MODE=true) with 0 API keys.'
      }
    ];

    cards.forEach((c, idx) => {
      const y = 1.8 + idx * 1.5;
      s.addShape(pres.ShapeType.roundRect, {
        x: 6.8,
        y,
        w: 5.4,
        h: 1.35,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });
      s.addText(c.title, {
        x: 7.1,
        y: y + 0.15,
        w: 4.8,
        h: 0.3,
        fontSize: 13,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(c.body, {
        x: 7.1,
        y: y + 0.45,
        w: 4.8,
        h: 0.75,
        fontSize: 11,
        color: TEXT_MUTED,
        lineSpacing: 16
      });
    });
  }

  // ==================== SLIDE 6: DATA INTEGRITY & ANTI-SPAM ====================
  {
    const s = createSlide('Evidence Integrity & Perceptual Anti-Spam', 'Data Verification');

    const verifs = [
      {
        title: '64-bit dHash Difference',
        tech: 'Perceptual Duplicate Filter',
        body: 'Sharp resizes evidence to 9x8 greyscale, evaluating gradient brightness. Hamming distance <= 8 vs. any report within 500m in the last 7 days flags duplicate spam.'
      },
      {
        title: 'Hardware EXIF Lock',
        tech: 'Tamper-Proof Coordinates',
        body: 'GPS latitude, longitude, and timestamps extracted directly from device hardware headers via exifr. Manual typing is barred; capture skew > 15 min tags report UNVERIFIED.'
      },
      {
        title: 'Weather Runoff Context',
        tech: 'Open-Meteo Integration',
        body: 'Fetches 72-hour precipitation telemetry at report coordinates. If recent rainfall >= 20mm, tags RAIN_CONTEXT to prevent false civic penalties for storm events.'
      }
    ];

    verifs.forEach((v, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 3.6,
        h: 4.6,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });
      s.addText(v.title, {
        x: x + 0.3,
        y: 2.1,
        w: 3.0,
        h: 0.4,
        fontSize: 16,
        color: ACCENT_TEAL,
        bold: true
      });
      s.addText(v.tech, {
        x: x + 0.3,
        y: 2.6,
        w: 3.0,
        h: 0.3,
        fontSize: 11,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(v.body, {
        x: x + 0.3,
        y: 3.1,
        w: 3.0,
        h: 2.9,
        fontSize: 11.5,
        color: TEXT_MUTED,
        lineSpacing: 18
      });
    });
  }

  // ==================== SLIDE 7: LAKE HEALTH SCORE FORMULA ====================
  {
    const s = createSlide('Dynamic Algorithmic Lake Health Score (0–100)', 'Signature Metric');

    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 6.0,
      h: 1.6,
      rectRadius: 0.1,
      fill: { color: '070D18' },
      line: { color: ACCENT_CYAN, width: 1.5 }
    });
    s.addText('Score = round(100 - min(100, 8 × ∑(severity_i × e^(-ageDays_i / 14)))) - Modifiers', {
      x: 1.0,
      y: 2.3,
      w: 5.6,
      h: 0.7,
      fontSize: 12,
      fontFace: 'Courier New',
      color: ACCENT_CYAN,
      bold: true
    });

    s.addText(
      '• 90-Day Exponential Decay: Half-life lambda = 14 days ensures remediated lakes recover.\n' +
      '• Sensory Modifiers: pH <6 or >9 subtracts 5 pts; Secchi depth <30cm subtracts 5 pts.\n' +
      '• Community Corroboration: >= 2 citizens within 250m and 48h increases triage priority.',
      {
        x: 0.8,
        y: 3.6,
        w: 6.0,
        h: 2.8,
        fontSize: 12,
        color: TEXT_MUTED,
        lineSpacing: 22
      }
    );

    // Benchmarks Card
    s.addShape(pres.ShapeType.roundRect, {
      x: 7.2,
      y: 1.8,
      w: 5.0,
      h: 4.6,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    s.addText('BENCHMARK BANDS (BENGALURU)', {
      x: 7.5,
      y: 2.1,
      w: 4.4,
      h: 0.3,
      fontSize: 11,
      color: TEXT_WHITE,
      bold: true
    });

    const bands = [
      { name: '70–100: Clean / Preserved', desc: 'Sankey Tank (84), Jakkur Lake (78)', color: '10B981' },
      { name: '40–70: Moderate / Warning', desc: 'Ulsoor Lake (58), Hebbal Lake (62)', color: 'F59E0B' },
      { name: '0–40: Critical Emergency', desc: 'Bellandur Lake (22), Varthur Lake (28)', color: 'EF4444' }
    ];

    bands.forEach((b, idx) => {
      const y = 2.6 + idx * 1.1;
      s.addShape(pres.ShapeType.roundRect, {
        x: 7.5,
        y,
        w: 4.4,
        h: 0.9,
        rectRadius: 0.08,
        fill: { color: '0F172A' },
        line: { color: b.color, width: 1 }
      });
      s.addText(b.name, {
        x: 7.7,
        y: y + 0.15,
        w: 4.0,
        h: 0.3,
        fontSize: 12,
        color: b.color,
        bold: true
      });
      s.addText(b.desc, {
        x: 7.7,
        y: y + 0.45,
        w: 4.0,
        h: 0.3,
        fontSize: 10,
        color: TEXT_MUTED
      });
    });
  }

  // ==================== SLIDE 8: TECH STACK ====================
  {
    const s = createSlide('Locked Full-Stack Architecture', 'Technology Stack');

    const stack = [
      { cat: 'FRONTEND & PWA', name: 'Next.js 14 + Tailwind', body: 'App Router, shadcn/ui accessible primitives, and Dexie.js (IndexedDB) for offline field queueing.' },
      { cat: 'DATABASE & AUTH', name: 'Prisma ORM + SQLite', body: 'Zero external database setup. NextAuth v5 with edge role-gating (CITIZEN, OFFICIAL, ADMIN).' },
      { cat: 'AI & VISION', name: 'Gemini 1.5 + Sharp', body: 'Multimodal vision triaging with offline deterministic fallback; 64-bit gradient perceptual dHash.' },
      { cat: 'GIS & GOVERNANCE', name: 'Leaflet + @react-pdf', body: 'OpenStreetMap dynamic heatmaps, Recharts 90-day time-series, PDF legal dockets, and 15-min node-cron.' }
    ];

    stack.forEach((st, idx) => {
      const x = 0.8 + idx * 2.95;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 2.75,
        h: 4.6,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });
      s.addText(st.cat, {
        x: x + 0.2,
        y: 2.1,
        w: 2.35,
        h: 0.3,
        fontSize: 10,
        color: ACCENT_CYAN,
        bold: true
      });
      s.addText(st.name, {
        x: x + 0.2,
        y: 2.5,
        w: 2.35,
        h: 0.5,
        fontSize: 14,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(st.body, {
        x: x + 0.2,
        y: 3.1,
        w: 2.35,
        h: 3.0,
        fontSize: 11,
        color: TEXT_MUTED,
        lineSpacing: 16
      });
    });
  }

  // ==================== SLIDE 9: GOVERNANCE STATE MACHINE ====================
  {
    const s = createSlide('Statutory State Machine & SLA Escalation', 'Governance Engine');

    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 11.4,
      h: 0.8,
      rectRadius: 0.08,
      fill: { color: '070D18' },
      line: { color: '1E293B', width: 1 }
    });
    s.addText('SUBMITTED → AI_VALIDATED → COMPLAINT_SENT → ACKNOWLEDGED → IN_PROGRESS → RESOLVED_CLAIMED → CITIZEN_VERIFIED → CLOSED', {
      x: 1.0,
      y: 2.05,
      w: 11.0,
      h: 0.4,
      fontSize: 11,
      fontFace: 'Courier New',
      color: ACCENT_TEAL,
      bold: true
    });

    const escalations = [
      { level: 'Level 1 Escalation (> 7 Days)', role: 'Ward Assistant Executive Engineer (AEE)', body: 'Triggered automatically by node-cron if complaint remains unacknowledged for 7 days.' },
      { level: 'Level 2 Escalation (> 14 Days)', role: 'Zonal Joint Commissioner (BBMP)', body: 'Escalated if remediation is not in progress within 14 days, promoting priority to URGENT.' },
      { level: 'Level 3 Escalation (> 21 Days)', role: 'Member Secretary, KSPCB', body: 'Statutory breach forwarded to State Pollution Control Board for formal legal prosecution.' }
    ];

    escalations.forEach((e, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 2.9,
        w: 3.6,
        h: 3.5,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: ACCENT_ROSE, width: 1 }
      });
      s.addText(e.level, {
        x: x + 0.25,
        y: 3.1,
        w: 3.1,
        h: 0.4,
        fontSize: 13,
        color: ACCENT_ROSE,
        bold: true
      });
      s.addText(e.role, {
        x: x + 0.25,
        y: 3.5,
        w: 3.1,
        h: 0.4,
        fontSize: 11,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(e.body, {
        x: x + 0.25,
        y: 4.0,
        w: 3.1,
        h: 2.1,
        fontSize: 11,
        color: TEXT_MUTED,
        lineSpacing: 16
      });
    });
  }

  // ==================== SLIDE 10: CITIZEN-VERIFIED CLOSURE ====================
  {
    const s = createSlide('The Citizen-Verified Closure Protocol', 'Accountability Gate');

    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 6.8,
      h: 4.6,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    s.addText('ELIMINATING "GHOST CLOSURES"', {
      x: 1.1,
      y: 2.1,
      w: 6.2,
      h: 0.3,
      fontSize: 12,
      color: ACCENT_CYAN,
      bold: true
    });
    s.addText(
      'Municipal contractors routinely mark complaints "Resolved" without physical remediation.\n\n' +
      'JalDrishti fundamentally alters this dynamic by withholding case finality until the reporting citizen conducts an on-ground audit:\n\n' +
      '1. Official Claims Remediation → Ticket state moves to RESOLVED_CLAIMED.\n' +
      '2. Citizen Signs Off → Inspects site, clicks "Verify Remediation" → CLOSED.\n' +
      '3. Dispute / Reopen → If cleanup is fraudulent, citizen clicks "Dispute" → REOPENED with immediate Level 2 escalation.',
      {
        x: 1.1,
        y: 2.5,
        w: 6.2,
        h: 3.6,
        fontSize: 12,
        color: TEXT_MUTED,
        lineSpacing: 20
      }
    );

    s.addShape(pres.ShapeType.roundRect, {
      x: 8.0,
      y: 1.8,
      w: 4.2,
      h: 4.6,
      rectRadius: 0.1,
      fill: { color: '070D18' },
      line: { color: ACCENT_TEAL, width: 1.5 }
    });

    s.addText('100%', {
      x: 8.2,
      y: 2.4,
      w: 3.8,
      h: 0.9,
      fontSize: 48,
      color: ACCENT_TEAL,
      bold: true,
      align: 'center'
    });
    s.addText('Citizen Authority', {
      x: 8.2,
      y: 3.3,
      w: 3.8,
      h: 0.4,
      fontSize: 16,
      color: TEXT_WHITE,
      bold: true,
      align: 'center'
    });
    s.addText('Cases cannot be closed without citizen validation.\n\nPublic ward rankings track citizen verification rates on /accountability.', {
      x: 8.4,
      y: 3.8,
      w: 3.4,
      h: 2.2,
      fontSize: 11.5,
      color: TEXT_MUTED,
      align: 'center',
      lineSpacing: 18
    });
  }

  // ==================== SLIDE 11: DEMO WALKTHROUGH ====================
  {
    const s = createSlide('5-Minute Live Judge Demo Loop', 'Interactive Demonstration');

    const demoSteps = [
      { step: 'Step 1 • Citizen', role: 'Report Incident', body: 'Visit /report. Select "Toxic Foam". Camera EXIF locks GPS onto mini-map. Record pH & Secchi depth.' },
      { step: 'Step 2 • AI Engine', role: 'AI Triage & PDF', body: 'Gemini 1.5 analyzes image, assigns Severity 4/5. dHash flags uniqueness. Auto-generates formal PDF notice.' },
      { step: 'Step 3 • Official', role: 'Triage & Remediate', body: 'Log in as official@demo.in at /official. View SLA queue. Move ticket: In Progress → Resolved Claimed.' },
      { step: 'Step 4 • Citizen', role: 'Verify & Close', body: 'Citizen visits /my-reports, audits physical cleanup, and clicks "Verify Remediation" to close the loop!' }
    ];

    demoSteps.forEach((d, idx) => {
      const x = 0.8 + idx * 2.95;
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 2.75,
        h: 4.6,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });
      s.addText(d.step, {
        x: x + 0.2,
        y: 2.1,
        w: 2.35,
        h: 0.3,
        fontSize: 11,
        color: ACCENT_AMBER,
        bold: true
      });
      s.addText(d.role, {
        x: x + 0.2,
        y: 2.5,
        w: 2.35,
        h: 0.4,
        fontSize: 14,
        color: TEXT_WHITE,
        bold: true
      });
      s.addText(d.body, {
        x: x + 0.2,
        y: 3.0,
        w: 2.35,
        h: 3.1,
        fontSize: 11,
        color: TEXT_MUTED,
        lineSpacing: 16
      });
    });
  }

  // ==================== SLIDE 12: CONCLUSION & CREDITS ====================
  {
    const s = pres.addSlide();
    s.background = { color: BG_DARK };

    s.addShape(pres.ShapeType.rect, {
      x: 4.7,
      y: 1.0,
      w: 3.6,
      h: 0.35,
      fill: { color: '164E63' },
      line: { color: ACCENT_CYAN, width: 1 }
    });
    s.addText('THANK YOU • Q&A', {
      x: 4.8,
      y: 1.05,
      w: 3.4,
      h: 0.25,
      fontSize: 10,
      color: ACCENT_CYAN,
      bold: true,
      align: 'center'
    });

    s.addText('Protecting Bengaluru’s Water Heritage with JalDrishti', {
      x: 1.0,
      y: 1.6,
      w: 11.0,
      h: 0.8,
      fontSize: 32,
      fontFace: 'Arial',
      color: ACCENT_CYAN,
      bold: true,
      align: 'center'
    });

    s.addText(
      'A scalable model for democratic, evidence-backed environmental governance—where citizen reports carry statutory legal weight, Generative AI eliminates triage delays, and municipal authorities are held demonstrably accountable.',
      {
        x: 2.0,
        y: 2.5,
        w: 9.0,
        h: 1.0,
        fontSize: 13,
        color: TEXT_MUTED,
        align: 'center',
        lineSpacing: 20
      }
    );

    // Presenter Credits Card
    s.addShape(pres.ShapeType.roundRect, {
      x: 3.5,
      y: 3.8,
      w: 6.0,
      h: 2.2,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: ACCENT_CYAN, width: 1.5 }
    });

    s.addText('PROJECT DEVELOPED & PRESENTED BY', {
      x: 3.7,
      y: 4.1,
      w: 5.6,
      h: 0.25,
      fontSize: 10,
      color: TEXT_MUTED,
      bold: true,
      align: 'center'
    });
    s.addText('Srishti A', {
      x: 3.7,
      y: 4.4,
      w: 5.6,
      h: 0.4,
      fontSize: 22,
      color: TEXT_WHITE,
      bold: true,
      align: 'center'
    });
    s.addText('Dayananda Sagar University (DSU)\nBengaluru, Karnataka', {
      x: 3.7,
      y: 4.9,
      w: 5.6,
      h: 0.8,
      fontSize: 14,
      color: ACCENT_CYAN,
      bold: true,
      align: 'center'
    });

    s.addText('Try Live Demo: http://localhost:3000   |   GitHub: https://github.com/Srishti2208/Water-Monitoring-System', {
      x: 1.0,
      y: 6.8,
      w: 11.0,
      h: 0.3,
      fontSize: 10,
      color: TEXT_MUTED,
      align: 'center'
    });
  }

  // Export to file
  const outPath = path.join(__dirname, '../../public/JalDrishti_Presentation_Srishti_A.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log('Successfully generated PowerPoint presentation at:', outPath);
}

createDeck().catch((err) => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
