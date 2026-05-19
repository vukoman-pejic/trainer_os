'use client';

import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { Card } from '../../../components/ui/card';

export default function ClientDashboardPage() {
  useAuthGuard({
    requiredRole: 'CLIENT',
  });

  return (
    <main className="min-h-screen bg-[#07070B] text-white p-10">
      <Card className="p-8">
        <h1 className="text-4xl font-bold">
          Client Dashboard
        </h1>

        <p className="mt-4 text-slate-400">
          Your training calendar and progress will
          appear here.
        </p>
      </Card>
    </main>
  );
}