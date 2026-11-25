# JalDrishti (जलदृष्टि) — Autonomous Lake & Water Quality Monitoring Platform

> **Bengaluru Civic-Tech Hackathon Solution**  
> Citizen-powered AI water pollution classification, real-time hotspot tracking, algorithmic Lake Health Scores, and autonomous statutory complaint escalation for Karnataka waterbodies.

---

## 🌟 Executive Summary

Bengaluru, once known as the "City of Lakes", has seen its interconnected wetland cascades degraded by untreated domestic effluent, toxic surfactant foam, and illegal construction debris dumping. 

**JalDrishti** closes the civic action loop:
1. **Citizen Field Evidence**: Citizens upload photos with client-side EXIF GPS and timestamp extraction, sensory indicators (odor, color, foam, dead fish), and 3 optional sensor readings (pH, Secchi transparency, temperature).
2. **Offline-First PWA**: Submissions made offline persist in IndexedDB via Dexie and auto-sync on reconnect.
3. **Perceptual Anti-Spam (dHash)**: Sharp 64-bit difference hashing detects duplicate images within 500m / 7 days (Hamming distance $\le 8$).
4. **Multimodal AI Vision Service**: Classifies pollution type (foam, algal bloom, sewage inflow, etc.) and severity (1–5).
5. **Meteorological Enrichment**: Integrates Open-Meteo 72h archive rainfall data to identify stormwater runoff spikes.
6. **Statutory Complaint Generation**: Auto-drafts formal legal notices to the BBMP Lakes Division and KSPCB under the Water Act, 1974, generating downloadable PDFs and dispatching emails.
7. **Statutory SLA State Machine & Escalation Engine**: Background cron monitors statutory response times (Level 1 Ward Officer $\to$ Level 2 Zonal Joint Commissioner $\to$ Level 3 Member Secretary, KSPCB).
8. **Citizen-Verified Closure**: Resolution requires citizen on-ground validation before case closure.

---

## ⚡ Quick Start (Zero External DB or API Key Setup)

The platform is configured with `DEMO_MODE=true` by default, meaning **all features—including Vision AI, Weather telemetry, and Email dispatch—run 100% offline with zero external API keys**.

```bash
# 1. Clone & install dependencies
git clone <repo-url>
cd "Water Monitoring System"
npm install

# 2. Database setup (Auto-creates and auto-seeds SQLite dev.db)
npx prisma db push
npx tsx src/scripts/seed.ts

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Personas & Credentials

The platform comes pre-seeded with 3 authenticated personas accessible via the **1-Tap Demo Switcher** at [`/login`](http://localhost:3000/login):

| Persona | Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `CITIZEN` | `citizen@demo.in` | `demo1234` | Submit geo-verified reports, view dockets, verify closures |
| **Er. Ramesh K** | `OFFICIAL` | `official@demo.in` | `demo1234` | Triage inbox, deploy cleanup, log formal actions |
| **Smt. Roopa V** | `ADMIN` | `admin@demo.in` | `demo1234` | Full system control, force database re-seeding, run SLA audit |

---

## ⏱️ 5-Minute Live Judge Demo Walkthrough Script

Follow these steps for a live demonstration of the full civic loop:

### Step 1: The Citizen Report (1.5 min)
1. Navigate to [`/report`](http://localhost:3000/report).
2. Under **Judge Fast-Test Scenarios**, click **"Toxic Foam (Bellandur)"** or upload your own photo.
3. Observe client-side **EXIF extraction**: coordinates (`12.9362°N, 77.6628°E`) and shutter timestamp render on the interactive mini-map with an **EXIF VERIFIED** badge.
4. Click **Proceed to Observations**. Note sensory options (Odor: *Chemical*, Color: *Black*, *Active Foam*, *Solid Waste*) and standard readings (pH 9.0, Transparency `<30cm`, Temp 28°C).
5. Click **Review & Confirm**, then click **Submit & Dispatch Notice**.
6. **Anti-Spam Verification**: Because the foam photo was previously logged in the seed dataset within 500m/7 days, notice how the dHash anti-spam engine instantly identifies the perceptual match and marks it duplicate without double counting!
7. Click **Submit Another Report** and pick **"Ganesh Visarjan Debris (Ulsoor)"** or **"Construction Dumping (Kasavanahalli)"**. Submit to see it pass AI classification and generate a fresh tracking ID (e.g. `JD-BLR-202611-XXXX`).

### Step 2: Inspection of the Hotspot Map & Health Score (1 min)
1. Go to [`/map`](http://localhost:3000/map).
2. Toggle the **Severity-Weighted Heatmap** and **Individual Report Markers**.
3. Use the **Time Aggregation Slider** (24h, 7d, 30d, 90d) to see reports filter dynamically.
4. Select **Bellandur Lake** (Score: 24/100, Critical Red) vs. **Sankey Tank** (Score: 74/100, Clean Green).
5. Click **View History** on any lake to open [`/lake/[id]`](http://localhost:3000/lake/cmwus6qqn00092gr1rlc14kkr), showing the **90-Day Recharts Trend Trajectory** and in-app subscription alert toggle.

### Step 3: Statutory Notice & PDF Generation (1 min)
1. In the report success screen or [`/my-reports`](http://localhost:3000/my-reports), click **View Complaint & PDF**.
2. Notice the formal civic letter addressed to the BBMP Assistant Executive Engineer and KSPCB under Section 24 of the Water Act, 1974.
3. Click **Download PDF Letter** to inspect the `@react-pdf/renderer` generated legal notice.
4. Click **Copy Complaint Text** to preview the pre-formatted semi-automated CPGRAMS / `pgportal.gov.in` handoff.

### Step 4: Official Triage & State Machine (1 min)
1. Switch role to **Official** via [`/login`](http://localhost:3000/login) (one-tap button for `official@demo.in`).
2. Navigate to [`/official`](http://localhost:3000/official).
3. View the **Statutory SLA Breach Queue** showing Level 1, 2, and 3 escalations.
4. Click **Run Statutory SLA Check** to watch the background monitor re-evaluate deadlines and create escalations.
5. In the **Ward Complaint Inbox**, click **Acknowledge**, then **Mark In Progress**, then **Mark Action Taken** (enter resolution note: *"Booms deployed, 1.2 MT scum removed"*).
6. Note the status transition to `RESOLVED_CLAIMED`.

### Step 5: Citizen-Verified Closure (0.5 min)
1. Switch back to **Citizen** (`citizen@demo.in`) and open [`/my-reports`](http://localhost:3000/my-reports).
2. The complaint now presents two citizen choices: **Verify Remediation** or **Reopen**.
3. Click **Verify Remediation**. Status transitions to `CITIZEN_VERIFIED` $\to$ `CLOSED` with a full tamper-evident audit trail!

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
    Citizen([Citizen Reporter / Mobile PWA]) -->|Photo + EXIF GPS| ClientEngine[Client Browser / exifr / Dexie]
    ClientEngine -->|POST /api/reports| APIRoute[Next.js App Router API]
    
    subgraph Verification Pipeline
        APIRoute --> dHashEngine[dHash Perceptual Hashing (Sharp)]
        dHashEngine --> AntiSpam[Anti-Spam & Duplicate Filter]
        AntiSpam --> VisionService[Vision Analysis Service]
        VisionService -->|Mock or Gemini 1.5| WeatherService[Open-Meteo Weather API]
    end

    subgraph State Machine & Database
        WeatherService --> PrismaORM[Prisma ORM]
        PrismaORM --> SQLite[(SQLite dev.db)]
        PrismaORM --> HealthCalc[Lake Health Score Engine]
        PrismaORM --> SLAEngine[node-cron SLA Monitor / Escalations]
    end

    subgraph Output & Civic Action
        PrismaORM --> PDFGen[@react-pdf/renderer Notice]
        PrismaORM --> EmailOutbox[Resend SDK / Outbox Ledger]
        PrismaORM --> HotspotMap[Leaflet + OSM Heatmap & Recharts]
        PrismaORM --> CPGRAMS[CPGRAMS / pgportal.gov.in Handoff]
    end
```

### Technology Breakdown
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui design patterns, Lucide icons (Blue/Teal civic palette)
- **Database**: SQLite via Prisma ORM (`dev.db`, zero-config file database)
- **Auth**: Auth.js (NextAuth v5) with Edge-compatible JWT middleware role-gating (`/official`, `/admin`)
- **Maps**: Leaflet + OpenStreetMap (No API key required)
- **Charts**: Recharts (90-day historical area charts, ward incident bars)
- **EXIF Extraction**: `exifr` (client-side extraction of GPS coordinates & shutter timestamps)
- **Perceptual Hashing**: `sharp` (64-bit dHash matrix comparison, Hamming distance $\le 8$)
- **PDF Generation**: `@react-pdf/renderer` (formal Indian administrative letterhead)
- **Email Delivery**: Resend SDK with automatic `DEMO_MODE` fallback to `Outbox` table
- **Meteorology**: Open-Meteo Archive API (72h precipitation analysis without keys)
- **Offline / PWA**: Native Service Worker + Dexie.js (IndexedDB queue with auto-sync)
- **Scheduler**: `node-cron` registered in `src/instrumentation.ts`

---

## 📊 Signature Metric: The Lake Health Score

The health score ($0 - 100$) dynamically evaluates lake degradation using an exponential decay model over a 90-day window:

$$\text{Health Score} = \text{round}\left(100 - \min\left(100, 8 \sum_{i=1}^N \text{severity}_i \times e^{-\frac{\text{ageDays}_i}{14}}\right)\right) - \text{modifiers}$$

### Modifiers:
- $\text{pH} < 6.0$ or $> 9.0$: **$-5$ points**
- Transparency $< 30\text{ cm}$: **$-5$ points**
- Community cross-validation ($\ge 2$ citizens within $250\text{m} / 48\text{h}$): **$+1$ effective severity** (capped at 5)

### Health Score Bands:
- 🟢 **70 – 100**: Good / Clean Baseline (e.g. *Sankey Tank*, *Jakkur Lake*)
- 🟡 **40 – 70**: Moderate Degradation / Caution (e.g. *Hebbal Lake*, *Madiwala Lake*)
- 🔴 **0 – 40**: Critical Ecological Emergency (e.g. *Bellandur Lake*, *Varthur Lake*)

---

## 🔄 State Machine & Statutory SLA Rules

The lifecycle is strictly enforced by the server state machine:

$$\text{SUBMITTED} \longrightarrow \text{AI\_VALIDATED} \longrightarrow \text{COMPLAINT\_SENT} \longrightarrow \text{ACKNOWLEDGED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED\_CLAIMED} \longrightarrow \text{CITIZEN\_VERIFIED} \longrightarrow \text{CLOSED}$$

- **Side States**: `REJECTED` (Spam / Duplicate photo), `REOPENED` (Citizen re-pollution notice).
- **SLA Breach 1**: Over 7 days without acknowledgment $\to$ **Level 1 Escalation** (Ward Executive Engineer).
- **SLA Breach 2**: Over 14 days without mobilization $\to$ **Level 2 Escalation** (Zonal Joint Commissioner).
- **SLA Breach 3**: Over 21 days unresolved $\to$ **Level 3 Escalation** (Member Secretary, KSPCB).

---

## 🔄 Note on YOLO / Computer Vision Model Swapping

JalDrishti implements the **Provider Design Pattern** (`src/services/vision/index.ts`):

```typescript
export interface IVisionService {
  analyzeWaterImage(imageInput: string | Buffer): Promise<VisionAnalysisResult>;
}
```

- In production or edge deployments with a fine-tuned **YOLOv8 / YOLOv11** water segmentation model (e.g. running on Triton Inference Server, FastAPI, or ONNX Runtime), you simply implement `YOLOVisionProvider implements IVisionService` and point the `analyzeWaterImage` function to your inference endpoint:

```typescript
export class YOLOVisionProvider implements IVisionService {
  async analyzeWaterImage(imageInput: string | Buffer): Promise<VisionAnalysisResult> {
    const res = await fetch("http://yolo-inference-host/predict", { method: "POST", body: ... });
    const { boxes, classes, confidence } = await res.json();
    return mapYOLOToJalDrishtiSchema(boxes, classes, confidence);
  }
}
```

No alterations to the state machine, anti-spam engine, database, or UI are required.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DEMO_MODE` | `true` | When `true`, uses mock vision, mock weather, and local Outbox table |
| `VISION_PROVIDER` | `mock` | `mock` for deterministic demo, `gemini` for live multimodal analysis |
| `GEMINI_API_KEY` | *(empty)* | Optional Google Gemini API key if `VISION_PROVIDER=gemini` |
| `RESEND_API_KEY` | *(empty)* | Optional Resend API key for live SMTP email transmission |
| `AUTH_SECRET` | `jaldrishti_...` | Auth.js secret key for session signing |
| `DATABASE_URL` | `"file:./dev.db"` | SQLite database path |

---

## 📜 License & Compliance

Developed under the MIT License for open environmental governance in Karnataka. Compliant with Central Government CPGRAMS format and National Green Tribunal (NGT) Principal Bench Directives.
