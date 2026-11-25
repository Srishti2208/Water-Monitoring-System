import { NextRequest, NextResponse } from 'next/server';
import { runSLACheck } from '@/services/slaService';

export async function GET() {
  try {
    const result = await runSLACheck();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error running SLA check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'SLA check failed' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await runSLACheck();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error running SLA check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'SLA check failed' },
      { status: 500 }
    );
  }
}
