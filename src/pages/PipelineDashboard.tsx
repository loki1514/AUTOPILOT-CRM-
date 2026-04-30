import { MainLayout } from '@/components/layout/MainLayout';
import { CrmDashboard } from '@/components/crm/CrmDashboard';

export default function PipelineDashboard() {
  return (
    <MainLayout>
      <CrmDashboard />
    </MainLayout>
  );
}