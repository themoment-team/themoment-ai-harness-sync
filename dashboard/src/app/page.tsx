import type { Metadata } from 'next';

import { DashboardView } from '@/views/dashboard';

export const metadata: Metadata = { title: { absolute: '대시보드 | AI Harness Sync' } };

export default function Home() {
  return <DashboardView />;
}
