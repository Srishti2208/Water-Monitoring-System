export interface RainfallContext {
  recentRainMm: number;
  isStormwaterRunoff: boolean;
  note: string;
  isHistoricalRain: boolean;
}

// In-memory daily cache keyed by `${lat.toFixed(2)},${lng.toFixed(2)},${dateStr}`
const weatherCache = new Map<string, RainfallContext>();

/**
 * Fetches last 72-hour cumulative rainfall from Open-Meteo or deterministic fallback.
 * Checks if precipitation >= 20mm in the 48h period before report capture.
 */
export async function getRainfallContext(
  lat: number,
  lng: number,
  captureDate: Date = new Date()
): Promise<RainfallContext> {
  const isDemo = process.env.DEMO_MODE !== 'false';
  const dateStr = captureDate.toISOString().split('T')[0];
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${dateStr}`;

  if (weatherCache.has(cacheKey)) {
    return weatherCache.get(cacheKey)!;
  }

  // If in DEMO_MODE, return deterministic mock rainfall context
  if (isDemo) {
    // Monsoon months in Bengaluru: July (month 6) and August (month 7) or September
    const month = captureDate.getMonth();
    const isMonsoonSeason = month >= 6 && month <= 8; // Jul, Aug, Sep
    const day = captureDate.getDate();
    // Simulate periodic monsoon showers
    const recentRainMm = isMonsoonSeason && (day % 3 === 0 || day % 5 === 0) ? 38.4 : 4.2;
    const isStormwaterRunoff = recentRainMm >= 20.0;
    const note = isStormwaterRunoff
      ? 'recent heavy rain — possible stormwater runoff'
      : 'dry antecedent conditions — minimal stormwater influence';

    const result: RainfallContext = {
      recentRainMm,
      isStormwaterRunoff,
      note,
      isHistoricalRain: true,
    };
    weatherCache.set(cacheKey, result);
    return result;
  }

  // Live Open-Meteo API call
  try {
    const endDate = dateStr;
    const startDateObj = new Date(captureDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const startDate = startDateObj.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=auto`;
    const res = await fetch(url, { headers: { 'User-Agent': 'JalDrishti-CivicTech/1.0' } });

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = await res.json();
    const precipArray: number[] = data?.daily?.precipitation_sum || [];
    const totalRain = precipArray.reduce((acc, curr) => acc + (curr || 0), 0);
    const roundedRain = Math.round(totalRain * 10) / 10;
    const isStormwaterRunoff = roundedRain >= 20.0;
    const note = isStormwaterRunoff
      ? 'recent heavy rain — possible stormwater runoff'
      : 'dry antecedent conditions — minimal stormwater influence';

    const result: RainfallContext = {
      recentRainMm: roundedRain,
      isStormwaterRunoff,
      note,
      isHistoricalRain: false,
    };
    weatherCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Open-Meteo weather fetch fallback:', error);
    const fallback: RainfallContext = {
      recentRainMm: 0,
      isStormwaterRunoff: false,
      note: 'weather telemetry unavailable — assuming dry baseline',
      isHistoricalRain: true,
    };
    weatherCache.set(cacheKey, fallback);
    return fallback;
  }
}
