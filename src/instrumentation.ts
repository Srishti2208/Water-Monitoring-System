export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const { runSLACheck } = await import('@/services/slaService');
    const { seedDatabase } = await import('@/scripts/seed');
    const { prisma } = await import('@/lib/prisma');

    console.log('[Instrumentation] Initializing JalDrishti background monitors and scheduler...');

    // 1. Auto-seed if database is empty on cold start
    try {
      const lakeCount = await prisma.lake.count();
      if (lakeCount === 0) {
        console.log('[Instrumentation] Cold start detected with empty DB. Auto-seeding...');
        await seedDatabase(false);
      }
    } catch (e) {
      console.warn('[Instrumentation] Auto-seed check error:', e);
    }

    // 2. Schedule SLA check every 15 minutes: "*/15 * * * *"
    cron.schedule('*/15 * * * *', async () => {
      console.log('[Scheduler] Running 15-minute SLA breach and escalation monitor...');
      try {
        const result = await runSLACheck();
        console.log(`[Scheduler] SLA check completed. Breaches detected: ${result.breachesDetected}, Escalations created: ${result.escalationsCreated}`);
      } catch (err) {
        console.error('[Scheduler] Error during scheduled SLA check:', err);
      }
    });

    console.log('[Instrumentation] Node-cron SLA monitor registered (runs every 15 min).');
  }
}
