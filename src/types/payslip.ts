// Payslip Run Status Types
export type PayslipRunStatus = 
  | 'draft' 
  | 'validating' 
  | 'validated' 
  | 'sending' 
  | 'partial' 
  | 'completed' 
  | 'failed';

// Payslip Job Status Types
export type PayslipJobStatus = 
  | 'pending' 
  | 'processing' 
  | 'sent' 
  | 'failed';

// Employee interface
export interface PayslipEmployee {
  id: string;
  user_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  normalized_name: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Payslip Run (Batch) interface
export interface PayslipRun {
  id: string;
  user_id: string;
  payroll_month: string;
  run_name: string | null;
  drive_folder_id: string;
  drive_folder_url: string;
  sender_name: string;
  sender_email: string;
  email_subject_template: string | null;
  email_body_template: string | null;
  email_tone: 'formal' | 'friendly';
  status: PayslipRunStatus;
  total_jobs: number;
  sent_count: number;
  failed_count: number;
  validation_snapshot: ValidationResult | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

// Payslip Job (One email = One job)
export interface PayslipJob {
  id: string;
  run_id: string;
  employee_id: string;
  drive_file_id: string;
  drive_file_name: string;
  match_confidence: number;
  status: PayslipJobStatus;
  retry_count: number;
  max_retries: number;
  error_code: string | null;
  error_message: string | null;
  resend_email_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Audit Log entry
export interface PayslipAuditLog {
  id: string;
  entity_type: 'run' | 'job' | 'employee';
  entity_id: string;
  action: string;
  performed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Google Drive file representation
export interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedTime: string;
}

// Employee-file mapping for validation
export interface EmployeeFileMapping {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  driveFileId: string | null;
  driveFileName: string | null;
  confidence: number;
  status: 'matched' | 'low_confidence' | 'missing';
  suggestion?: string;
}

// Validation result from the validation step
export interface ValidationResult {
  valid: boolean;
  totalEmployees: number;
  matchedCount: number;
  lowConfidenceCount: number;
  missingCount: number;
  mappings: EmployeeFileMapping[];
  issues: ValidationIssue[];
}

// Individual validation issue
export interface ValidationIssue {
  type: 'missing' | 'low_confidence' | 'duplicate' | 'invalid_email';
  employeeId: string;
  employeeName: string;
  message: string;
  suggestion: string;
}

// Setup form data
export interface PayslipSetupData {
  driveFolderUrl: string;
  payrollMonth: string;
  senderName: string;
  senderEmail: string;
}

// Email template data
export interface EmailTemplateData {
  subject: string;
  body: string;
  tone: 'formal' | 'friendly';
}

// Job with employee details for UI
export interface PayslipJobWithEmployee extends PayslipJob {
  employee?: PayslipEmployee;
}

// Run with computed stats
export interface PayslipRunWithStats extends PayslipRun {
  pendingCount: number;
  processingCount: number;
}
