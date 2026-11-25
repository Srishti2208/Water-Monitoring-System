import React from 'react';
import { prisma } from '@/lib/prisma';
import { Trophy, Medal, Award, ShieldCheck, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const revalidate = 0;

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    where: {
      role: 'CITIZEN',
    },
    include: {
      reports: {
        where: {
          status: { notIn: ['REJECTED'] },
        },
      },
    },
  });

  const rankedUsers = users
    .map((u) => ({
      id: u.id,
      name: u.name || 'Citizen Monitor',
      email: u.email,
      trustScore: u.trustScore,
      validatedReportsCount: u.reports.length,
      verifiedCount: u.reports.filter((r) => r.status === 'CITIZEN_VERIFIED' || r.status === 'CLOSED').length,
    }))
    .sort((a, b) => b.validatedReportsCount - a.validatedReportsCount);

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Hotspot Map
        </Link>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
          Citizen Guardian Honor Roll
        </Badge>
      </div>

      <div className="bg-gradient-to-r from-sky-800 to-teal-700 text-white rounded-xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lake Champions Leaderboard
          </h1>
          <p className="text-xs text-sky-100 mt-1 max-w-md">
            Celebrating citizen scientists and community monitors whose validated photo evidence protects Bengaluru&apos;s lakes.
          </p>
        </div>
        <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
          <Trophy className="h-8 w-8 text-amber-300" />
        </div>
      </div>

      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-sky-600" />
            Top Environmental Guardians (All-Time &amp; Monthly)
          </CardTitle>
          <span className="text-xs text-slate-500">Based on AI-validated reports</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {rankedUsers.map((user, idx) => {
              const isTop3 = idx < 3;
              return (
                <div
                  key={user.id}
                  className={`p-4 flex items-center justify-between text-xs transition-colors ${
                    idx === 0
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : idx === 1
                      ? 'bg-slate-50/60 hover:bg-slate-100/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full font-black flex items-center justify-center text-sm shadow-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        {user.name}
                        {idx === 0 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-sky-700 text-sm">
                        {user.validatedReportsCount} Reports
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {user.verifiedCount} Citizen Closed
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Trust Score
                      </div>
                      <Badge variant="verified" className="text-xs font-mono">
                        {user.trustScore} / 100
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
