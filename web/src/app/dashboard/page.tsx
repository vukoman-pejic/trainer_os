'use client';

import {
  Calendar,
  Package,
  Users,
} from 'lucide-react';
import { TrainerLayout } from '../../components/layouts/trainer-layout';
import { Card } from '../../components/ui/card';
import { useAuthGuard } from '../../hooks/use-auth-guard';

export default function DashboardPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  if (!authorized) {
    return null;
  }

  return (
    <TrainerLayout>
      <h2 className="text-4xl font-bold mb-8">
        Dashboard
      </h2>

      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <Users size={28} />
          <p className="mt-4 text-slate-400">
            Active Clients
          </p>
          <h3 className="text-3xl font-bold mt-2">
            12
          </h3>
        </Card>

        <Card className="p-6">
          <Calendar size={28} />
          <p className="mt-4 text-slate-400">
            Today's Sessions
          </p>
          <h3 className="text-3xl font-bold mt-2">
            8
          </h3>
        </Card>

        <Card className="p-6">
          <Package size={28} />
          <p className="mt-4 text-slate-400">
            Active Packages
          </p>
          <h3 className="text-3xl font-bold mt-2">
            21
          </h3>
        </Card>

        <Card className="p-6">
          <Users size={28} />
          <p className="mt-4 text-slate-400">
            Pending Requests
          </p>
          <h3 className="text-3xl font-bold mt-2">
            3
          </h3>
        </Card>
      </div>
    </TrainerLayout>
  );
}