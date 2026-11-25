import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="container max-w-md py-16 px-4 text-center space-y-4">
      <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
      <p className="text-xs text-slate-600">
        You do not possess the required administrative or official credentials to view this desk.
        Please switch to the <strong>Official (official@demo.in)</strong> or <strong>Admin (admin@demo.in)</strong> demo account.
      </p>
      <div className="pt-2 flex justify-center gap-3">
        <Link href="/login">
          <Button variant="civic" size="sm">
            Switch Demo Role &rarr;
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
