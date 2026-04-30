import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DriveFile, ValidationResult, EmployeeFileMapping } from '@/types/payslip';
import { toast } from 'sonner';

// List PDF files from Google Drive folder
export function useListDriveFiles() {
  return useMutation({
    mutationFn: async (folderUrl: string) => {
      const { data, error } = await supabase.functions.invoke('list-drive-files', {
        body: { folderUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { folderId: string; files: DriveFile[]; count: number };
    },
    onError: (error: Error) => {
      toast.error(`Failed to list files: ${error.message}`);
    },
  });
}

// Validate employee-file mapping
export function useValidatePayslipMapping() {
  return useMutation({
    mutationFn: async ({ files, payrollMonth }: { files: DriveFile[]; payrollMonth: string }) => {
      const { data, error } = await supabase.functions.invoke('validate-payslip-mapping', {
        body: { files, payrollMonth },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ValidationResult;
    },
    onError: (error: Error) => {
      toast.error(`Validation failed: ${error.message}`);
    },
  });
}

// Generate email template
export function useGeneratePayslipEmail() {
  return useMutation({
    mutationFn: async (params: {
      companyName: string;
      payrollMonth: string;
      tone: 'formal' | 'friendly';
      senderName: string;
      customFooter?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-payslip-email', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { subject: string; body: string };
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate email: ${error.message}`);
    },
  });
}

// Create payslip jobs
export function useCreatePayslipJobs() {
  return useMutation({
    mutationFn: async ({ runId, mappings }: {
      runId: string;
      mappings: Array<{
        employeeId: string;
        driveFileId: string;
        driveFileName: string;
        confidence: number;
      }>;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-payslip-jobs', {
        body: { runId, mappings },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { success: boolean; runId: string; jobCount: number };
    },
    onSuccess: () => {
      toast.success('Jobs created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create jobs: ${error.message}`);
    },
  });
}

// Process a single payslip job
export function useProcessPayslipJob() {
  return useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase.functions.invoke('process-single-payslip-job', {
        body: { runId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { 
        processed: boolean; 
        jobId?: string; 
        status?: string;
        reason?: string;
        runStatus?: string;
        employeeName?: string;
        error?: string;
      };
    },
  });
}

// Retry failed jobs
export function useRetryFailedJobs() {
  return useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase.functions.invoke('retry-failed-payslip-jobs', {
        body: { runId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { success: boolean; resetCount: number };
    },
    onSuccess: (data) => {
      toast.success(`${data.resetCount} jobs queued for retry`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to retry jobs: ${error.message}`);
    },
  });
}
