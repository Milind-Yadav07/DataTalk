'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import EmptyState from '../layout/EmptyState';

export default function EmptyDashboardState() {
  const router = useRouter();

  return (
    <EmptyState
      icon={LayoutDashboard}
      title="No dashboards created yet"
      description="Create a dashboard to group visual insights, query results, and charts about your datasets in one workspace."
      ctaText="Upload a Dataset"
      onCtaClick={() => router.push('/upload')}
    />
  );
}
