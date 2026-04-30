import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PayslipJob, PayslipJobWithEmployee, PayslipEmployee } from '@/types/payslip';

export function usePayslipJobs(runId: string) {
  return useQuery({
    queryKey: ['payslip-jobs', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payslip_jobs')
        .select(`
          *,
          payslip_employees (
            id,
            employee_name,
            employee_email,
            department
          )
        `)
        .eq('run_id', runId)
        .order('created_at');

      if (error) throw error;
      
      return (data || []).map(job => ({
        ...job,
        employee: job.payslip_employees ? {
          ...job.payslip_employees,
          user_id: '',
          employee_id: '',
          normalized_name: '',
          is_active: true,
          created_at: '',
          updated_at: '',
        } as PayslipEmployee : undefined,
      })) as PayslipJobWithEmployee[];
    },
    enabled: !!runId,
    refetchInterval: (query) => {
      // Poll while there are processing jobs
      const hasProcessing = query.state.data?.some(j => 
        j.status === 'pending' || j.status === 'processing'
      );
      return hasProcessing ? 2000 : false;
    },
  });
}

export function usePayslipJobStats(runId: string) {
  const { data: jobs, ...rest } = usePayslipJobs(runId);

  const stats = {
    total: jobs?.length || 0,
    pending: jobs?.filter(j => j.status === 'pending').length || 0,
    processing: jobs?.filter(j => j.status === 'processing').length || 0,
    sent: jobs?.filter(j => j.status === 'sent').length || 0,
    failed: jobs?.filter(j => j.status === 'failed').length || 0,
    progress: jobs?.length 
      ? ((jobs.filter(j => j.status === 'sent' || j.status === 'failed').length / jobs.length) * 100)
      : 0,
  };

  return { jobs, stats, ...rest };
}
