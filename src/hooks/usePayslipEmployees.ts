import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PayslipEmployee } from '@/types/payslip';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Normalize name for fuzzy matching
function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function usePayslipEmployees() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const employeesQuery = useQuery({
    queryKey: ['payslip-employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payslip_employees')
        .select('*')
        .order('employee_name');

      if (error) throw error;
      return data as PayslipEmployee[];
    },
    enabled: !!user,
  });

  const createEmployee = useMutation({
    mutationFn: async (employee: {
      employee_id: string;
      employee_name: string;
      employee_email: string;
      department?: string;
    }) => {
      const { data, error } = await supabase
        .from('payslip_employees')
        .insert({
          ...employee,
          user_id: user!.id,
          normalized_name: normalizeForMatching(employee.employee_name),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-employees'] });
      toast.success('Employee added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add employee: ${error.message}`);
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayslipEmployee> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.employee_name) {
        updateData.normalized_name = normalizeForMatching(updates.employee_name);
      }

      const { data, error } = await supabase
        .from('payslip_employees')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-employees'] });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payslip_employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-employees'] });
      toast.success('Employee deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete employee: ${error.message}`);
    },
  });

  const bulkImportEmployees = useMutation({
    mutationFn: async (employees: Array<{
      employee_id: string;
      employee_name: string;
      employee_email: string;
      department?: string;
    }>) => {
      const records = employees.map(emp => ({
        ...emp,
        user_id: user!.id,
        normalized_name: normalizeForMatching(emp.employee_name),
      }));

      const { data, error } = await supabase
        .from('payslip_employees')
        .upsert(records, { 
          onConflict: 'user_id,employee_email',
          ignoreDuplicates: false 
        })
        .select();
        
      if (error) {
        console.error('Bulk import error:', error);
        throw error;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payslip-employees'] });
      toast.success(`Imported ${data.length} employees`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import employees: ${error.message}`);
    },
  });

  return {
    employees: employeesQuery.data || [],
    isLoading: employeesQuery.isLoading,
    error: employeesQuery.error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImportEmployees,
  };
}
