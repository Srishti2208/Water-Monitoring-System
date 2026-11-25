'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Droplets,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DEMO_ACCOUNTS = [
  {
    role: 'CITIZEN',
    name: 'Aarav Sharma',
    email: 'citizen@demo.in',
    password: 'demo1234',
    badge: 'Citizen Monitor',
    description: 'Submit geo-tagged pollution reports, track status, and verify remediation on-ground.',
    variant: 'default' as const,
  },
  {
    role: 'OFFICIAL',
    name: 'Er. Ramesh K',
    email: 'official@demo.in',
    password: 'demo1234',
    badge: 'Ward Officer (BBMP)',
    description: 'Acknowledge statutory notices, deploy cleanup crews, and log formal remediation actions.',
    variant: 'civic' as const,
  },
  {
    role: 'ADMIN',
    name: 'Smt. Roopa V',
    email: 'admin@demo.in',
    password: 'demo1234',
    badge: 'Lake Division Admin',
    description: 'System-wide control, force database re-seeding, trigger SLA monitors, and inspect outbox.',
    variant: 'secondary' as const,
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('citizen@demo.in');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (userEmail: string, userPass: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: userEmail,
        password: userPass,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg('Invalid credentials. Please ensure the database is seeded.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Login error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ONE-TAP DEMO PERSONAS */}
      <Card className="shadow-xs border-sky-200 bg-sky-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            1-Tap Demo Switcher (Password: demo1234)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={loading}
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.password);
                handleSignIn(acc.email, acc.password);
              }}
              className="w-full text-left p-3 rounded-lg border bg-white hover:border-sky-500 hover:bg-sky-50/50 transition-all text-xs space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 group-hover:text-sky-700">
                  {acc.name}
                </span>
                <Badge variant={acc.role === 'OFFICIAL' ? 'default' : acc.role === 'ADMIN' ? 'verified' : 'secondary'} className="text-[10px]">
                  {acc.badge}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">{acc.description}</p>
              <div className="text-[10px] text-sky-600 font-mono flex items-center justify-between pt-1">
                <span>{acc.email}</span>
                <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Sign in as {acc.role} &rarr;
                </span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* STANDARD CREDENTIALS FORM */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">
            Manual Credentials Login
          </CardTitle>
          <CardDescription className="text-xs">
            Authenticate with registered email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn(email, password);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs h-9 px-3 rounded border bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs h-9 px-3 rounded border bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <Button
              type="submit"
              variant="civic"
              disabled={loading}
              className="w-full text-xs h-9"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container max-w-lg py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-md">
          <Droplets className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In to JalDrishti
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Fast-access demo accounts for judges and evaluators. Select a pre-seeded persona to test role-gated workflows.
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-xs text-slate-400 py-6">Loading authentication portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
