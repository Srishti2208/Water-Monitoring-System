import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { computeDHash } from '../services/dhash';
import { draftComplaintLetter } from '../services/complaint';

export async function seedDatabase(force: boolean = false) {
  const lakeCount = await prisma.lake.count();
  if (lakeCount > 0 && !force) {
    console.log('Database already contains data. Skipping auto-seed.');
    return { success: true, message: 'Database already populated' };
  }

  console.log('Starting JalDrishti database seed...');

  if (force) {
    // Clean up in reverse dependency order
    await prisma.statusEvent.deleteMany({});
    await prisma.escalation.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.lakeHealthSnapshot.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.lake.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.outbox.deleteMany({});
  }

  // 1. Create demo users
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const citizenUser = await prisma.user.upsert({
    where: { email: 'citizen@demo.in' },
    update: {},
    create: {
      email: 'citizen@demo.in',
      name: 'Aarav Sharma (Citizen)',
      password: hashedPassword,
      role: 'CITIZEN',
      trustScore: 100,
    },
  });

  const officialUser = await prisma.user.upsert({
    where: { email: 'official@demo.in' },
    update: {},
    create: {
      email: 'official@demo.in',
      name: 'Er. Ramesh K (Ward Officer)',
      password: hashedPassword,
      role: 'OFFICIAL',
      trustScore: 100,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.in' },
    update: {},
    create: {
      email: 'admin@demo.in',
      name: 'Smt. Roopa V (Lake Division Admin)',
      password: hashedPassword,
      role: 'ADMIN',
      trustScore: 100,
    },
  });

  const communityUser1 = await prisma.user.upsert({
    where: { email: 'ananya.sharma@demo.in' },
    update: {},
    create: {
      email: 'ananya.sharma@demo.in',
      name: 'Ananya Sharma (Ecologist)',
      password: hashedPassword,
      role: 'CITIZEN',
      trustScore: 98,
    },
  });

  const communityUser2 = await prisma.user.upsert({
    where: { email: 'rahul.nair@demo.in' },
    update: {},
    create: {
      email: 'rahul.nair@demo.in',
      name: 'Rahul Nair (Lake Warden)',
      password: hashedPassword,
      role: 'CITIZEN',
      trustScore: 95,
    },
  });

  // 2. Create 12 real Bengaluru lakes
  const lakesData = [
    {
      name: 'Bellandur Lake',
      ward: 'Ward 150 - Bellandur',
      lat: 12.936,
      lng: 77.6625,
      currentHealthScore: 24,
      trend: 'DECLINING',
    },
    {
      name: 'Varthur Lake',
      ward: 'Ward 149 - Varthur',
      lat: 12.9554,
      lng: 77.734,
      currentHealthScore: 32,
      trend: 'DECLINING',
    },
    {
      name: 'Ulsoor Lake',
      ward: 'Ward 112 - Halasuru',
      lat: 12.9825,
      lng: 77.62,
      currentHealthScore: 46,
      trend: 'DECLINING',
    },
    {
      name: 'Hebbal Lake',
      ward: 'Ward 7 - Hebbal',
      lat: 13.045,
      lng: 77.5925,
      currentHealthScore: 64,
      trend: 'STABLE',
    },
    {
      name: 'Sankey Tank',
      ward: 'Ward 35 - Sadashivanagar',
      lat: 13.007,
      lng: 77.573,
      currentHealthScore: 88,
      trend: 'IMPROVING',
    },
    {
      name: 'Agara Lake',
      ward: 'Ward 174 - HSR Layout',
      lat: 12.923,
      lng: 77.648,
      currentHealthScore: 78,
      trend: 'IMPROVING',
    },
    {
      name: 'Madiwala Lake',
      ward: 'Ward 172 - BTM Layout',
      lat: 12.915,
      lng: 77.618,
      currentHealthScore: 68,
      trend: 'STABLE',
    },
    {
      name: 'Kasavanahalli Lake',
      ward: 'Ward 150 - Bellandur',
      lat: 12.909,
      lng: 77.678,
      currentHealthScore: 38,
      trend: 'DECLINING',
    },
    {
      name: 'Jakkur Lake',
      ward: 'Ward 5 - Jakkur',
      lat: 13.078,
      lng: 77.609,
      currentHealthScore: 85,
      trend: 'IMPROVING',
    },
    {
      name: 'Rachenahalli Lake',
      ward: 'Ward 6 - Thanisandra',
      lat: 13.052,
      lng: 77.624,
      currentHealthScore: 72,
      trend: 'STABLE',
    },
    {
      name: 'Yediyur Lake',
      ward: 'Ward 167 - Yediyur',
      lat: 12.93,
      lng: 77.575,
      currentHealthScore: 76,
      trend: 'STABLE',
    },
    {
      name: 'Kempambudhi Lake',
      ward: 'Ward 141 - Chamrajpet',
      lat: 12.958,
      lng: 77.564,
      currentHealthScore: 54,
      trend: 'DECLINING',
    },
    {
      name: 'Yelahanka Lake',
      ward: 'Ward 4 - Yelahanka Satellite Town',
      lat: 13.1007,
      lng: 77.5963,
      currentHealthScore: 79,
      trend: 'IMPROVING',
    },
    {
      name: 'Nagavara Lake',
      ward: 'Ward 23 - Nagavara / Hebbal',
      lat: 13.0428,
      lng: 77.62,
      currentHealthScore: 58,
      trend: 'STABLE',
    },
    {
      name: 'Kaggadasapura Lake',
      ward: 'Ward 83 - C.V. Raman Nagar',
      lat: 12.984,
      lng: 77.678,
      currentHealthScore: 36,
      trend: 'DECLINING',
    },
    {
      name: 'Harlur Lake',
      ward: 'Ward 174 - Harlur / HSR Sub-catchment',
      lat: 12.903,
      lng: 77.662,
      currentHealthScore: 44,
      trend: 'DECLINING',
    },
    {
      name: 'Kengeri Lake',
      ward: 'Ward 159 - Kengeri',
      lat: 12.9125,
      lng: 77.485,
      currentHealthScore: 65,
      trend: 'STABLE',
    },
    {
      name: 'Puttenahalli Lake',
      ward: 'Ward 187 - Puttenahalli / JP Nagar',
      lat: 12.894,
      lng: 77.587,
      currentHealthScore: 82,
      trend: 'IMPROVING',
    },
  ];

  const lakes: Record<string, any> = {};
  for (const item of lakesData) {
    const l = await prisma.lake.create({
      data: item,
    });
    lakes[item.name] = l;
  }

  // Precompute dHashes for demo photos
  const foamHash = await computeDHash('/demo-images/foam.jpg');
  const sewageHash = await computeDHash('/demo-images/sewage_inflow.jpg');
  const wasteHash = await computeDHash('/demo-images/solid_waste.jpg');
  const debrisHash = await computeDHash('/demo-images/construction_debris.jpg');
  const algalHash = await computeDHash('/demo-images/algal_bloom.jpg');
  const cleanHash = await computeDHash('/demo-images/clean_water.jpg');
  const visarjanHash = await computeDHash('/demo-images/visarjan_debris.jpg');
  const deadFishHash = await computeDHash('/demo-images/dead_fish.jpg');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // 3. SEED SPECIFIC STORYLINE REPORTS

  // STORYLINE 1: Bellandur Lake — Chronic severe sewage & toxic foam
  const bellandurReports = [
    {
      lake: lakes['Bellandur Lake'],
      user: citizenUser,
      days: 3,
      photos: ['/demo-images/foam.jpg'],
      dHash: foamHash,
      lat: 12.9362,
      lng: 77.6628,
      readings: { ph: 9.2, transparencyCmBucket: '<30cm', tempC: 28.5 },
      observations: { odor: 'chemical', color: 'black', foam: true, waste: true, deadFish: false },
      vision: {
        labels: ['foam', 'discoloration'],
        severity: 5,
        confidence: 0.98,
        provider: 'mock',
        notes: 'Massive white froth plume accumulating at Yemalur weir outflow. Active caustic hydrocarbon signature.',
      },
      rainContext: { recentRainMm: 34.2, isStormwaterRunoff: true, note: 'recent heavy rain — possible stormwater runoff' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'CRITICAL',
    },
    {
      lake: lakes['Bellandur Lake'],
      user: communityUser1,
      days: 25,
      photos: ['/demo-images/sewage_inflow.jpg'],
      dHash: sewageHash,
      lat: 12.9358,
      lng: 77.662,
      readings: { ph: 8.8, transparencyCmBucket: '<30cm', tempC: 27.2 },
      observations: { odor: 'sewage', color: 'black', foam: true, waste: true, deadFish: false },
      vision: {
        labels: ['sewage_inflow', 'foam'],
        severity: 5,
        confidence: 0.95,
        provider: 'mock',
        notes: 'Raw unsegregated municipal blackwater discharge bypassing primary interception culvert.',
      },
      rainContext: { recentRainMm: 2.1, isStormwaterRunoff: false, note: 'dry antecedent conditions' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'ACKNOWLEDGED',
      priority: 'CRITICAL',
      escalatedDays: 20, // SLA breached!
    },
  ];

  // STORYLINE 2: Ulsoor Lake — September Ganesh Visarjan Festival Spike
  const ulsoorReports = [
    {
      lake: lakes['Ulsoor Lake'],
      user: citizenUser,
      days: 12,
      photos: ['/demo-images/visarjan_debris.jpg', '/demo-images/solid_waste.jpg'],
      dHash: visarjanHash,
      lat: 12.9827,
      lng: 77.6205,
      readings: { ph: 7.8, transparencyCmBucket: '30-60cm', tempC: 26.0 },
      observations: { odor: 'none', color: 'green', foam: false, waste: true, deadFish: false },
      vision: {
        labels: ['solid_waste', 'discoloration'],
        severity: 4,
        confidence: 0.94,
        provider: 'mock',
        notes: 'Post-festival idol immersion debris: Plaster of Paris fragments, synthetic paint, and withered flowers.',
      },
      rainContext: { recentRainMm: 14.5, isStormwaterRunoff: false, note: 'moderate drizzle' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
    {
      lake: lakes['Ulsoor Lake'],
      user: communityUser2,
      days: 35,
      photos: ['/demo-images/dead_fish.jpg'],
      dHash: deadFishHash,
      lat: 12.9821,
      lng: 77.6198,
      readings: { ph: 9.4, transparencyCmBucket: '<30cm', tempC: 29.0 },
      observations: { odor: 'chemical', color: 'brown', foam: false, waste: true, deadFish: true },
      vision: {
        labels: ['dead_fish', 'algal_bloom'],
        severity: 5,
        confidence: 0.97,
        provider: 'mock',
        notes: 'Severe hypoxia / fish kill incident along Kensington road bank.',
      },
      rainContext: { recentRainMm: 28.0, isStormwaterRunoff: true, note: 'recent heavy rain — possible stormwater runoff' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'CRITICAL',
      escalatedDays: 30, // SLA breached!
    },
  ];

  // STORYLINE 3: Jakkur Lake — Improving lake with citizen-verified before/after closure pair
  const jakkurReports = [
    {
      lake: lakes['Jakkur Lake'],
      user: citizenUser,
      days: 50,
      photos: ['/demo-images/solid_waste.jpg'],
      dHash: wasteHash,
      lat: 13.0782,
      lng: 77.6092,
      readings: { ph: 7.4, transparencyCmBucket: '30-60cm', tempC: 25.0 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: true, deadFish: false },
      vision: {
        labels: ['solid_waste'],
        severity: 2,
        confidence: 0.91,
        provider: 'mock',
        notes: 'Localized polythene and litter accumulation near northern walkway.',
      },
      rainContext: { recentRainMm: 5.0, isStormwaterRunoff: false, note: 'clear weather' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'CLOSED',
      priority: 'LOW',
      resolvedWithPair: true, // Will have resolution note + citizen verification note
    },
    {
      lake: lakes['Jakkur Lake'],
      user: communityUser1,
      days: 8,
      photos: ['/demo-images/clean_water.jpg'],
      dHash: cleanHash,
      lat: 13.0785,
      lng: 77.6095,
      readings: { ph: 7.2, transparencyCmBucket: '>60cm', tempC: 24.5 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: false, deadFish: false },
      vision: {
        labels: [],
        severity: 1,
        confidence: 0.96,
        provider: 'mock',
        notes: 'Water surface appears clear and healthy. Wetland treatment ecosystem functioning optimally.',
      },
      rainContext: { recentRainMm: 0.0, isStormwaterRunoff: false, note: 'dry clear' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'CITIZEN_VERIFIED',
      priority: 'LOW',
    },
  ];

  // STORYLINE 4: Kasavanahalli Lake — Illegal Dumping Hotspot with Community-Verified Cluster
  const kasavanahalliReports = [
    {
      lake: lakes['Kasavanahalli Lake'],
      user: citizenUser,
      days: 4,
      photos: ['/demo-images/construction_debris.jpg'],
      dHash: debrisHash,
      lat: 12.9092,
      lng: 77.6782,
      readings: { ph: 7.6, transparencyCmBucket: '<30cm', tempC: 26.5 },
      observations: { odor: 'none', color: 'brown', foam: false, waste: true, deadFish: false },
      vision: {
        labels: ['construction_debris', 'solid_waste'],
        severity: 4,
        confidence: 0.93,
        provider: 'mock',
        notes: 'Heavy commercial tipper trucks dumping construction silt and concrete slabs directly into lake buffer.',
      },
      rainContext: { recentRainMm: 22.4, isStormwaterRunoff: true, note: 'recent heavy rain — possible stormwater runoff' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'HIGH',
      escalatedDays: 16, // SLA breached!
    },
    {
      lake: lakes['Kasavanahalli Lake'],
      user: communityUser2,
      days: 3,
      photos: ['/demo-images/construction_debris.jpg'],
      dHash: debrisHash,
      lat: 12.9095,
      lng: 77.6785, // within 50m of above report!
      readings: { ph: 7.5, transparencyCmBucket: '<30cm', tempC: 26.8 },
      observations: { odor: 'none', color: 'brown', foam: false, waste: true, deadFish: false },
      vision: {
        labels: ['construction_debris'],
        severity: 4,
        confidence: 0.95,
        provider: 'mock',
        notes: 'Corroborated illegal encroachment: mud filling underway near southwestern inlet.',
      },
      rainContext: { recentRainMm: 22.4, isStormwaterRunoff: true, note: 'recent heavy rain' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'ACKNOWLEDGED',
      priority: 'HIGH',
    },
  ];

  // STORYLINE 5: Varthur Lake — SLA Breached Complaint with Multiple Escalation Levels
  const varthurReports = [
    {
      lake: lakes['Varthur Lake'],
      user: communityUser1,
      days: 28,
      photos: ['/demo-images/sewage_inflow.jpg', '/demo-images/foam.jpg'],
      dHash: sewageHash,
      lat: 12.9556,
      lng: 77.7342,
      readings: { ph: 8.9, transparencyCmBucket: '<30cm', tempC: 28.0 },
      observations: { odor: 'sewage', color: 'black', foam: true, waste: true, deadFish: false },
      vision: {
        labels: ['sewage_inflow', 'foam'],
        severity: 5,
        confidence: 0.97,
        provider: 'mock',
        notes: 'Unabated industrial and domestic effluent ingress causing heavy stench and weed choking.',
      },
      rainContext: { recentRainMm: 45.0, isStormwaterRunoff: true, note: 'recent heavy rain — possible stormwater runoff' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'CRITICAL',
      escalatedDays: 25, // SLA breached level 3!
    },
  ];

  // STORYLINE 6: Kempambudhi Lake — SLA Breached Level 2
  const kempambudhiReports = [
    {
      lake: lakes['Kempambudhi Lake'],
      user: citizenUser,
      days: 18,
      photos: ['/demo-images/solid_waste.jpg'],
      dHash: wasteHash,
      lat: 12.9582,
      lng: 77.5642,
      readings: { ph: 7.9, transparencyCmBucket: '30-60cm', tempC: 25.5 },
      observations: { odor: 'sewage', color: 'green', foam: false, waste: true, deadFish: false },
      vision: {
        labels: ['solid_waste', 'algal_bloom'],
        severity: 3,
        confidence: 0.88,
        provider: 'mock',
        notes: 'Garbage accumulation around historical sluice gate.',
      },
      rainContext: { recentRainMm: 12.0, isStormwaterRunoff: false, note: 'moderate drizzle' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'HIGH',
      escalatedDays: 16, // SLA breached level 2!
    },
  ];

  // Additional reports for other lakes to make Bangalore map rich and vibrant
  const generalReports = [
    {
      lake: lakes['Hebbal Lake'],
      user: communityUser2,
      days: 15,
      photos: ['/demo-images/algal_bloom.jpg'],
      dHash: algalHash,
      lat: 13.0452,
      lng: 77.5928,
      readings: { ph: 8.2, transparencyCmBucket: '30-60cm', tempC: 26.0 },
      observations: { odor: 'none', color: 'green', foam: false, waste: false, deadFish: false },
      vision: { labels: ['algal_bloom'], severity: 2, confidence: 0.89, provider: 'mock', notes: 'Moderate seasonal micro-algae film.' },
      rainContext: { recentRainMm: 6.0, isStormwaterRunoff: false, note: 'clear' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'AI_VALIDATED',
      priority: 'LOW',
    },
    {
      lake: lakes['Sankey Tank'],
      user: citizenUser,
      days: 20,
      photos: ['/demo-images/clean_water.jpg'],
      dHash: cleanHash,
      lat: 13.0072,
      lng: 77.5732,
      readings: { ph: 7.3, transparencyCmBucket: '>60cm', tempC: 24.0 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: false, deadFish: false },
      vision: { labels: [], severity: 1, confidence: 0.95, provider: 'mock', notes: 'Pristine aerated water condition.' },
      rainContext: { recentRainMm: 1.0, isStormwaterRunoff: false, note: 'clear' },
      trust: { exifVerified: true, communityVerified: true, duplicateOfId: null },
      status: 'CLOSED',
      priority: 'LOW',
    },
    {
      lake: lakes['Agara Lake'],
      user: communityUser1,
      days: 7,
      photos: ['/demo-images/solid_waste.jpg'],
      dHash: wasteHash,
      lat: 12.9234,
      lng: 77.6482,
      readings: { ph: 7.5, transparencyCmBucket: '30-60cm', tempC: 25.2 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: true, deadFish: false },
      vision: { labels: ['solid_waste'], severity: 2, confidence: 0.9, provider: 'mock', notes: 'Snack wrappers left near jogging perimeter.' },
      rainContext: { recentRainMm: 8.0, isStormwaterRunoff: false, note: 'light rain' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'IN_PROGRESS',
      priority: 'LOW',
    },
    {
      lake: lakes['Madiwala Lake'],
      user: communityUser2,
      days: 10,
      photos: ['/demo-images/algal_bloom.jpg'],
      dHash: algalHash,
      lat: 12.9152,
      lng: 77.6184,
      readings: { ph: 7.9, transparencyCmBucket: '30-60cm', tempC: 25.8 },
      observations: { odor: 'none', color: 'green', foam: false, waste: false, deadFish: false },
      vision: { labels: ['algal_bloom'], severity: 3, confidence: 0.91, provider: 'mock', notes: 'Eutrophication in western inlet bay.' },
      rainContext: { recentRainMm: 15.0, isStormwaterRunoff: false, note: 'moderate drizzle' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'COMPLAINT_SENT',
      priority: 'MEDIUM',
    },
    {
      lake: lakes['Rachenahalli Lake'],
      user: citizenUser,
      days: 14,
      photos: ['/demo-images/clean_water.jpg'],
      dHash: cleanHash,
      lat: 13.0522,
      lng: 77.6244,
      readings: { ph: 7.4, transparencyCmBucket: '>60cm', tempC: 24.8 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: false, deadFish: false },
      vision: { labels: [], severity: 1, confidence: 0.94, provider: 'mock', notes: 'Clear littoral fringe.' },
      rainContext: { recentRainMm: 2.0, isStormwaterRunoff: false, note: 'clear' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'CLOSED',
      priority: 'LOW',
    },
    {
      lake: lakes['Yediyur Lake'],
      user: communityUser1,
      days: 11,
      photos: ['/demo-images/solid_waste.jpg'],
      dHash: wasteHash,
      lat: 12.9304,
      lng: 77.5752,
      readings: { ph: 7.6, transparencyCmBucket: '30-60cm', tempC: 25.0 },
      observations: { odor: 'none', color: 'clear', foam: false, waste: true, deadFish: false },
      vision: { labels: ['solid_waste'], severity: 2, confidence: 0.88, provider: 'mock', notes: 'Single-use plastic packets caught in aerator net.' },
      rainContext: { recentRainMm: 4.0, isStormwaterRunoff: false, note: 'clear' },
      trust: { exifVerified: true, communityVerified: false, duplicateOfId: null },
      status: 'ACKNOWLEDGED',
      priority: 'LOW',
    },
  ];

  const allSeedReportConfigs = [
    ...bellandurReports,
    ...ulsoorReports,
    ...jakkurReports,
    ...kasavanahalliReports,
    ...varthurReports,
    ...kempambudhiReports,
    ...generalReports,
  ];

  let reportCounter = 100;
  for (const repConfig of allSeedReportConfigs) {
    reportCounter++;
    const captureDate = daysAgo(repConfig.days);
    const uploadDate = new Date(captureDate.getTime() + 10 * 60 * 1000); // 10 min skew

    const report = await prisma.report.create({
      data: {
        lakeId: repConfig.lake.id,
        userId: repConfig.user.id,
        photoPaths: JSON.stringify(repConfig.photos),
        lat: repConfig.lat,
        lng: repConfig.lng,
        capturedAt: captureDate,
        uploadedAt: uploadDate,
        readings: JSON.stringify(repConfig.readings),
        observations: JSON.stringify(repConfig.observations),
        vision: JSON.stringify(repConfig.vision),
        rainContext: JSON.stringify(repConfig.rainContext),
        trust: JSON.stringify(repConfig.trust),
        status: repConfig.status,
        dHash: repConfig.dHash,
        createdAt: uploadDate,
        updatedAt: uploadDate,
      },
    });

    // Create Initial Submission Event
    await prisma.statusEvent.create({
      data: {
        reportId: report.id,
        fromStatus: 'SUBMITTED',
        toStatus: 'SUBMITTED',
        actor: `Citizen (${repConfig.user.email})`,
        note: 'Citizen observation and geo-tagged photo evidence logged.',
        timestamp: uploadDate,
      },
    });

    // Create AI Validation Event
    const valDate = new Date(uploadDate.getTime() + 2 * 60 * 1000);
    await prisma.statusEvent.create({
      data: {
        reportId: report.id,
        fromStatus: 'SUBMITTED',
        toStatus: 'AI_VALIDATED',
        actor: 'JalDrishti AI Vision Service',
        note: `Vision verified: ${repConfig.vision.labels.join(', ') || 'Clean baseline'} (Severity ${repConfig.vision.severity}/5).`,
        timestamp: valDate,
      },
    });

    // Create Complaint if past AI_VALIDATED
    if (repConfig.status !== 'SUBMITTED' && repConfig.status !== 'AI_VALIDATED' && repConfig.status !== 'REJECTED') {
      const trackingId = `JD-BLR-2026-${reportCounter}`;
      const complaintSentDate = new Date(valDate.getTime() + 5 * 60 * 1000);

      const letterText = draftComplaintLetter({
        reportId: report.id,
        trackingId,
        lakeName: repConfig.lake.name,
        ward: repConfig.lake.ward,
        lat: repConfig.lat,
        lng: repConfig.lng,
        capturedAt: captureDate,
        labels: repConfig.vision.labels,
        severity: repConfig.vision.severity,
        readings: repConfig.readings,
        observations: repConfig.observations,
        rainContext: repConfig.rainContext,
        visionNotes: repConfig.vision.notes,
        photoPaths: repConfig.photos,
        citizenName: repConfig.user.name || undefined,
        citizenEmail: repConfig.user.email,
      });

      const complaint = await prisma.complaint.create({
        data: {
          reportId: report.id,
          trackingId,
          letterText,
          emailStatus: 'SENT_DEMO',
          priority: (repConfig.priority as any) || 'MEDIUM',
          sentAt: complaintSentDate,
          createdAt: complaintSentDate,
        },
      });

      // Outbox log
      await prisma.outbox.create({
        data: {
          to: `wardofficer.${repConfig.lake.ward.toLowerCase().replace(/[^a-z0-9]/g, '')}@bbmp.gov.in`,
          subject: `[JalDrishti ${trackingId}] Urgent Pollution Report: ${repConfig.lake.name}`,
          body: letterText,
          status: 'SENT_DEMO',
          createdAt: complaintSentDate,
        },
      });

      await prisma.statusEvent.create({
        data: {
          reportId: report.id,
          complaintId: complaint.id,
          fromStatus: 'AI_VALIDATED',
          toStatus: 'COMPLAINT_SENT',
          actor: 'JalDrishti Civic Dispatch Engine',
          note: `Formal complaint auto-drafted and transmitted to BBMP Ward Office. Tracking ID: ${trackingId}`,
          timestamp: complaintSentDate,
        },
      });

      // Handle ACKNOWLEDGED / IN_PROGRESS / RESOLVED_CLAIMED / CITIZEN_VERIFIED / CLOSED
      if (['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED_CLAIMED', 'CITIZEN_VERIFIED', 'CLOSED'].includes(repConfig.status)) {
        const ackDate = new Date(complaintSentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        await prisma.statusEvent.create({
          data: {
            reportId: report.id,
            complaintId: complaint.id,
            fromStatus: 'COMPLAINT_SENT',
            toStatus: 'ACKNOWLEDGED',
            actor: 'Ward Executive Engineer (official@demo.in)',
            note: 'Complaint docketed. Junior engineer assigned for on-site inspection.',
            timestamp: ackDate,
          },
        });
      }

      if (['IN_PROGRESS', 'RESOLVED_CLAIMED', 'CITIZEN_VERIFIED', 'CLOSED'].includes(repConfig.status)) {
        const progDate = new Date(complaintSentDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        await prisma.statusEvent.create({
          data: {
            reportId: report.id,
            complaintId: complaint.id,
            fromStatus: 'ACKNOWLEDGED',
            toStatus: 'IN_PROGRESS',
            actor: 'Ward Executive Engineer (official@demo.in)',
            note: 'Field cleanup crew and containment booms deployed at site.',
            timestamp: progDate,
          },
        });
      }

      if (['RESOLVED_CLAIMED', 'CITIZEN_VERIFIED', 'CLOSED'].includes(repConfig.status)) {
        const resDate = new Date(complaintSentDate.getTime() + 10 * 24 * 60 * 60 * 1000);
        await prisma.statusEvent.create({
          data: {
            reportId: report.id,
            complaintId: complaint.id,
            fromStatus: 'IN_PROGRESS',
            toStatus: 'RESOLVED_CLAIMED',
            actor: 'Ward Executive Engineer (official@demo.in)',
            note: 'Surface debris removed, drain flap valve repaired, photographic proof logged.',
            timestamp: resDate,
          },
        });
      }

      if (['CITIZEN_VERIFIED', 'CLOSED'].includes(repConfig.status)) {
        const verDate = new Date(complaintSentDate.getTime() + 12 * 24 * 60 * 60 * 1000);
        await prisma.statusEvent.create({
          data: {
            reportId: report.id,
            complaintId: complaint.id,
            fromStatus: 'RESOLVED_CLAIMED',
            toStatus: 'CITIZEN_VERIFIED',
            actor: `Citizen (${repConfig.user.email})`,
            note: 'Site re-inspected: Water clear and garbage cleared. Remediated confirmed by reporting citizen.',
            timestamp: verDate,
          },
        });
      }

      if (repConfig.status === 'CLOSED') {
        const closeDate = new Date(complaintSentDate.getTime() + 13 * 24 * 60 * 60 * 1000);
        await prisma.statusEvent.create({
          data: {
            reportId: report.id,
            complaintId: complaint.id,
            fromStatus: 'CITIZEN_VERIFIED',
            toStatus: 'CLOSED',
            actor: 'JalDrishti System',
            note: 'Lifecycle complete. Case archived with citizen verified certificate.',
            timestamp: closeDate,
          },
        });
      }

      // Check SLA Escalation storyline
      if ((repConfig as any).escalatedDays) {
        const daysBreached = (repConfig as any).escalatedDays;
        if (daysBreached >= 7) {
          await prisma.escalation.create({
            data: {
              complaintId: complaint.id,
              level: 1,
              reason: 'SLA Breach: Over 7 days elapsed without formal acknowledgment by Ward Officer.',
              createdAt: new Date(complaintSentDate.getTime() + 8 * 24 * 60 * 60 * 1000),
            },
          });
        }
        if (daysBreached >= 14) {
          await prisma.escalation.create({
            data: {
              complaintId: complaint.id,
              level: 2,
              reason: 'SLA Breach: Over 14 days elapsed without field mobilization. Escalated to Zonal Joint Commissioner.',
              createdAt: new Date(complaintSentDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            },
          });
        }
        if (daysBreached >= 21) {
          await prisma.escalation.create({
            data: {
              complaintId: complaint.id,
              level: 3,
              reason: 'STATUTORY BREACH: Over 21 days unresolved. Escalated to Member Secretary, KSPCB for prosecution review.',
              createdAt: new Date(complaintSentDate.getTime() + 22 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }

  // 4. Create Lake Subscriptions
  for (const lakeName of ['Bellandur Lake', 'Ulsoor Lake', 'Jakkur Lake', 'Sankey Tank']) {
    await prisma.subscription.create({
      data: {
        userId: citizenUser.id,
        lakeId: lakes[lakeName].id,
      },
    });
  }

  // 5. Generate 90 days of daily LakeHealthSnapshot records for every lake
  console.log('Generating 90 days of historical health snapshots for all 12 lakes...');
  for (const lake of Object.values(lakes)) {
    const baseScore = lake.currentHealthScore;
    const isImproving = lake.trend === 'IMPROVING';
    const isDeclining = lake.trend === 'DECLINING';

    for (let day = 90; day >= 0; day--) {
      const snapDate = daysAgo(day);
      let dayScore = baseScore;

      // Realistic trend simulation
      if (isImproving) {
        // Was lower 90 days ago, improved over time
        const improvement = Math.round(((90 - day) / 90) * 16);
        dayScore = Math.max(40, Math.min(100, baseScore - 16 + improvement + ((day % 5) - 2)));
      } else if (isDeclining) {
        // Was higher 90 days ago, degraded over time
        const degradation = Math.round(((90 - day) / 90) * 18);
        dayScore = Math.max(10, Math.min(85, baseScore + 18 - degradation + ((day % 4) - 2)));
      } else {
        // Stable with small fluctuation
        dayScore = Math.max(40, Math.min(95, baseScore + ((day % 6) - 3)));
      }

      // Ulsoor September Visarjan dip around day 10-15
      if (lake.name === 'Ulsoor Lake' && day >= 10 && day <= 15) {
        dayScore = Math.max(30, dayScore - 14);
      }

      await prisma.lakeHealthSnapshot.create({
        data: {
          lakeId: lake.id,
          date: snapDate,
          score: dayScore,
        },
      });
    }
  }

  console.log('JalDrishti database successfully seeded!');
  return { success: true, message: 'Database successfully seeded with 12 lakes, reports, snapshots, and demo users.' };
}

// Allow CLI execution: `npx tsx src/scripts/seed.ts`
if (require.main === module) {
  seedDatabase(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
