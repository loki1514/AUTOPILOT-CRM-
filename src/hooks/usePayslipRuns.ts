import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PayslipRun, ValidationResult } from '@/types/payslip';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Helper to cast database row to PayslipRun
function toPayslipRun(row: Record<string, unknown>): PayslipRun {
  return {
    ...row,
    email_tone: (row.email_tone as 'formal' | 'friendly') || 'formal',
    validation_snapshot: row.validation_snapshot as ValidationResult | null,
  } as PayslipRun;
}

export function usePayslipRuns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const runsQuery = useQuery({
    queryKey: ['payslip-runs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payslip_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toPayslipRun);
    },
    enabled: !!user,
  });

  const createRun = useMutation({
    mutationFn: async (run: {
      payroll_month: string;
      run_name?: string;
      drive_folder_id: string;
      drive_folder_url: string;
      sender_name: string;
      sender_email: string;
    }) => {
      const { data, error } = await supabase
        .from('payslip_runs')
        .insert({
          ...run,
          user_id: user!.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return toPayslipRun(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-runs'] });
      toast.success('Payslip run created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create run: ${error.message}`);
    },
  });

  const updateRun = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayslipRun> & { id: string }) => {
      // Convert validation_snapshot to JSON-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.validation_snapshot) {
        dbUpdates.validation_snapshot = updates.validation_snapshot as unknown;
      }

      const { data, error } = await supabase
        .from('payslip_runs')
        .update(dbUpdates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toPayslipRun(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-runs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update run: ${error.message}`);
    },
  });

  const deleteRun = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payslip_runs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-runs'] });
      toast.success('Run deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete run: ${error.message}`);
    },
  });

  return {
    runs: runsQuery.data || [],
    isLoading: runsQuery.isLoading,
    error: runsQuery.error,
    createRun,
    updateRun,
    deleteRun,
    refetch: runsQuery.refetch,
  };
}

// Hook to get a single run with polling during sending
export function usePayslipRun(runId: string) {
  return useQuery({
    queryKey: ['payslip-run', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payslip_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (error) throw error;
      return toPayslipRun(data as Record<string, unknown>);
    },
    enabled: !!runId,
    refetchInterval: (query) => {
      // Poll every 2 seconds while sending
      if (query.state.data?.status === 'sending') {
        return 2000;
      }
      return false;
    },
  });
}
