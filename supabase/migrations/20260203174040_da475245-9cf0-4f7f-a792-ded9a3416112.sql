-- =====================================================
-- PAYSLIP AUTOMATION SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Enum for run status
CREATE TYPE payslip_run_status AS ENUM (
  'draft', 'validating', 'validated', 'sending', 'partial', 'completed', 'failed'
);

-- Enum for job status
CREATE TYPE payslip_job_status AS ENUM (
  'pending', 'processing', 'sent', 'failed'
);

-- =====================================================
-- 1. PAYSLIP EMPLOYEES (Master Employee List)
-- =====================================================
CREATE TABLE payslip_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, employee_email)
);

-- Enable RLS
ALTER TABLE payslip_employees ENABLE ROW LEVEL SECURITY;

-- RLS policies for employees
CREATE POLICY "Users can view their own employees"
  ON payslip_employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own employees"
  ON payslip_employees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees"
  ON payslip_employees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees"
  ON payslip_employees FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fuzzy matching
CREATE INDEX idx_payslip_employees_normalized ON payslip_employees(user_id, normalized_name);

-- Trigger for updated_at
CREATE TRIGGER update_payslip_employees_updated_at
  BEFORE UPDATE ON payslip_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. PAYSLIP RUNS (Batch/Run Info)
-- =====================================================
CREATE TABLE payslip_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payroll_month TEXT NOT NULL,
  run_name TEXT,
  drive_folder_id TEXT NOT NULL,
  drive_folder_url TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  email_subject_template TEXT,
  email_body_template TEXT,
  email_tone TEXT DEFAULT 'formal',
  status payslip_run_status NOT NULL DEFAULT 'draft',
  total_jobs INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  validation_snapshot JSONB,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, payroll_month)
);

-- Enable RLS
ALTER TABLE payslip_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for runs
CREATE POLICY "Users can view their own runs"
  ON payslip_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs"
  ON payslip_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
  ON payslip_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs"
  ON payslip_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_payslip_runs_status ON payslip_runs(user_id, status);
CREATE INDEX idx_payslip_runs_month ON payslip_runs(user_id, payroll_month);

-- Trigger for updated_at
CREATE TRIGGER update_payslip_runs_updated_at
  BEFORE UPDATE ON payslip_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. PAYSLIP JOBS (One Row = One Email)
-- =====================================================
CREATE TABLE payslip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES payslip_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES payslip_employees(id),
  drive_file_id TEXT NOT NULL,
  drive_file_name TEXT NOT NULL,
  match_confidence NUMERIC(5,2),
  status payslip_job_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_code TEXT,
  error_message TEXT,
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, employee_id)
);

-- Enable RLS
ALTER TABLE payslip_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs (based on run ownership)
CREATE POLICY "Users can view jobs for their runs"
  ON payslip_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM payslip_runs
    WHERE payslip_runs.id = payslip_jobs.run_id
      AND payslip_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create jobs for their runs"
  ON payslip_jobs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM payslip_runs
    WHERE payslip_runs.id = payslip_jobs.run_id
      AND payslip_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update jobs for their runs"
  ON payslip_jobs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM payslip_runs
    WHERE payslip_runs.id = payslip_jobs.run_id
      AND payslip_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete jobs for their runs"
  ON payslip_jobs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM payslip_runs
    WHERE payslip_runs.id = payslip_jobs.run_id
      AND payslip_runs.user_id = auth.uid()
  ));

-- Indexes for job queue efficiency
CREATE INDEX idx_payslip_jobs_pending ON payslip_jobs(run_id, status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_payslip_jobs_run_status ON payslip_jobs(run_id, status);

-- Trigger for updated_at
CREATE TRIGGER update_payslip_jobs_updated_at
  BEFORE UPDATE ON payslip_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. PAYSLIP AUDIT LOGS (Immutable Trail)
-- =====================================================
CREATE TABLE payslip_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE payslip_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - append only (no UPDATE/DELETE)
CREATE POLICY "Users can view audit logs they created"
  ON payslip_audit_logs FOR SELECT
  USING (auth.uid() = performed_by);

CREATE POLICY "Users can create audit logs"
  ON payslip_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = performed_by);

-- Index for querying logs
CREATE INDEX idx_payslip_audit_logs_entity ON payslip_audit_logs(entity_type, entity_id);
CREATE INDEX idx_payslip_audit_logs_performed_by ON payslip_audit_logs(performed_by, created_at DESC);