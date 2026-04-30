import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { SetupForm } from '@/components/payroll/SetupForm';
import { ValidationTable } from '@/components/payroll/ValidationTable';
import { EmailPreview } from '@/components/payroll/EmailPreview';
import { SendProgress } from '@/components/payroll/SendProgress';
import { EmployeeManager } from '@/components/payroll/EmployeeManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { RunStatusBadge } from '@/components/payroll/StatusBadges';
import { usePayslipRuns, usePayslipRun } from '@/hooks/usePayslipRuns';
import { usePayslipEmployees } from '@/hooks/usePayslipEmployees';
import { usePayslipJobStats } from '@/hooks/usePayslipJobs';
import {
  useListDriveFiles,
  useValidatePayslipMapping,
  useGeneratePayslipEmail,
  useCreatePayslipJobs,
  useProcessPayslipJob,
  useRetryFailedJobs,
} from '@/hooks/usePayslipActions';
import { DriveFile, EmployeeFileMapping, ValidationResult } from '@/types/payslip';
import { Plus, FileSpreadsheet, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type WizardStep = 'setup' | 'validate' | 'preview' | 'send';

export default function Payroll() {
  const navigate = useNavigate();
  const { runs, isLoading: runsLoading } = usePayslipRuns();
  const [showNewRun, setShowNewRun] = useState(false);

  if (showNewRun) {
    return <PayrollWizard onClose={() => setShowNewRun(false)} />;
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground">
              Distribute payslips to employees via email
            </p>
          </div>
          <Button onClick={() => setShowNewRun(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Payslip Run
          </Button>
        </div>

        <Tabs defaultValue="runs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="runs">Payslip Runs</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="runs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Payslip Runs
                </CardTitle>
                <CardDescription>
                  History of all payslip distribution runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : runs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payslip runs yet</p>
                    <p className="text-sm">Create your first run to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payroll Month</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">
                            {formatPayrollMonth(run.payroll_month)}
                          </TableCell>
                          <TableCell>
                            <RunStatusBadge status={run.status} />
                          </TableCell>
                          <TableCell>{run.total_jobs}</TableCell>
                          <TableCell className="text-green-600">{run.sent_count}</TableCell>
                          <TableCell className="text-red-600">{run.failed_count}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(run.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/payroll/${run.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function formatPayrollMonth(month: string) {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Wizard Component
function PayrollWizard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>('setup');
  const [runId, setRunId] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [emailTemplate, setEmailTemplate] = useState({ subject: '', body: '' });
  const [emailTone, setEmailTone] = useState<'formal' | 'friendly'>('formal');
  const [confirmedMappings, setConfirmedMappings] = useState<Set<string>>(new Set());
  
  // Form data from step 1
  const [setupData, setSetupData] = useState({
    driveFolderUrl: '',
    payrollMonth: '',
    senderName: '',
    senderEmail: '',
  });

  const { employees } = usePayslipEmployees();
  const { createRun, updateRun } = usePayslipRuns();
  const listDriveFiles = useListDriveFiles();
  const validateMapping = useValidatePayslipMapping();
  const generateEmail = useGeneratePayslipEmail();
  const createJobs = useCreatePayslipJobs();
  const processJob = useProcessPayslipJob();
  const retryFailed = useRetryFailedJobs();

  // Get run and jobs for sending step
  const { data: run, refetch: refetchRun } = usePayslipRun(runId || '');
  const { jobs, stats, refetch: refetchJobs } = usePayslipJobStats(runId || '');

  // Step 1: Setup
  const handleSetup = async (data: typeof setupData) => {
    setSetupData(data);
    
    try {
      // List files from Drive
      const result = await listDriveFiles.mutateAsync(data.driveFolderUrl);
      setDriveFiles(result.files);
      setDriveFolderId(result.folderId);

      if (result.files.length === 0) {
        toast.error('No PDF files found in the folder');
        return;
      }

      // Validate mapping
      const validation = await validateMapping.mutateAsync({
        files: result.files,
        payrollMonth: data.payrollMonth,
      });
      setValidationResult(validation);

      setStep('validate');
    } catch (error) {
      // Error handled by mutations
    }
  };

  // Step 2: Validation
  const handleValidationContinue = async () => {
    if (!validationResult) return;

    try {
      // Generate email template
      const template = await generateEmail.mutateAsync({
        companyName: 'Autopilot Offices',
        payrollMonth: formatPayrollMonth(setupData.payrollMonth),
        tone: emailTone,
        senderName: setupData.senderName,
      });
      setEmailTemplate(template);

      setStep('preview');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleConfirmLowConfidence = (employeeId: string) => {
    setConfirmedMappings(prev => new Set(prev).add(employeeId));
    
    // Update validation result to mark as matched
    if (validationResult) {
      const updatedMappings = validationResult.mappings.map(m => 
        m.employeeId === employeeId 
          ? { ...m, status: 'matched' as const }
          : m
      );
      const updatedIssues = validationResult.issues.filter(i => 
        !(i.employeeId === employeeId && i.type === 'low_confidence')
      );
      
      setValidationResult({
        ...validationResult,
        mappings: updatedMappings,
        issues: updatedIssues,
        valid: updatedMappings.every(m => m.status !== 'missing') && 
               updatedIssues.filter(i => i.type === 'invalid_email').length === 0,
        matchedCount: updatedMappings.filter(m => m.status === 'matched').length,
        lowConfidenceCount: updatedMappings.filter(m => m.status === 'low_confidence').length,
      });
    }
  };

  // Step 3: Preview & Confirm
  const handleConfirmAndSend = async () => {
    if (!validationResult) return;

    try {
      // Create run record
      const newRun = await createRun.mutateAsync({
        payroll_month: setupData.payrollMonth,
        drive_folder_id: driveFolderId,
        drive_folder_url: setupData.driveFolderUrl,
        sender_name: setupData.senderName,
        sender_email: setupData.senderEmail,
      });

      setRunId(newRun.id);

      // Save email template to run
      await updateRun.mutateAsync({
        id: newRun.id,
        email_subject_template: emailTemplate.subject,
        email_body_template: emailTemplate.body,
        email_tone: emailTone,
      });

      // Create jobs from mappings
      const jobMappings = validationResult.mappings
        .filter(m => m.status !== 'missing' && m.driveFileId)
        .map(m => ({
          employeeId: m.employeeId,
          driveFileId: m.driveFileId!,
          driveFileName: m.driveFileName!,
          confidence: m.confidence,
        }));

      await createJobs.mutateAsync({
        runId: newRun.id,
        mappings: jobMappings,
      });

      setStep('send');

      // Start processing jobs
      startSending(newRun.id);
    } catch (error) {
      // Error handled by mutations
    }
  };

  // Step 4: Send
  const [isSending, setIsSending] = useState(false);

  const startSending = async (id: string) => {
    setIsSending(true);
    
    let processing = true;
    while (processing) {
      try {
        const result = await processJob.mutateAsync(id);
        
        if (!result.processed) {
          processing = false;
        } else {
          // Small delay between jobs
          await new Promise(r => setTimeout(r, 500));
        }

        // Refresh data
        await refetchJobs();
        await refetchRun();
      } catch (error) {
        console.error('Error processing job:', error);
        processing = false;
      }
    }

    setIsSending(false);
    await queryClient.invalidateQueries({ queryKey: ['payslip-runs'] });
  };

  const handleRetryFailed = async () => {
    if (!runId) return;
    
    await retryFailed.mutateAsync(runId);
    await refetchJobs();
    
    // Resume sending
    startSending(runId);
  };

  const handleToneChange = async (tone: 'formal' | 'friendly') => {
    setEmailTone(tone);
    
    // Regenerate template with new tone
    const template = await generateEmail.mutateAsync({
      companyName: 'Autopilot Offices',
      payrollMonth: formatPayrollMonth(setupData.payrollMonth),
      tone,
      senderName: setupData.senderName,
    });
    setEmailTemplate(template);
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Back Button */}
        {step !== 'send' && (
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => step === 'setup' ? onClose() : setStep(
              step === 'validate' ? 'setup' : 
              step === 'preview' ? 'validate' : 'setup'
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 'setup' ? 'Back to Runs' : 'Back'}
          </Button>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['setup', 'validate', 'preview', 'send'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s ? 'bg-primary text-primary-foreground' : 
                  ['setup', 'validate', 'preview', 'send'].indexOf(step) > i 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'}
              `}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-12 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'setup' && (
          <SetupForm 
            onSubmit={handleSetup}
            isLoading={listDriveFiles.isPending || validateMapping.isPending}
          />
        )}

        {step === 'validate' && validationResult && (
          <ValidationTable
            mappings={validationResult.mappings}
            issues={validationResult.issues}
            isValid={validationResult.valid}
            onBack={() => setStep('setup')}
            onContinue={handleValidationContinue}
            onConfirmLowConfidence={handleConfirmLowConfidence}
          />
        )}

        {step === 'preview' && (
          <EmailPreview
            subject={emailTemplate.subject}
            body={emailTemplate.body}
            senderName={setupData.senderName}
            senderEmail={setupData.senderEmail}
            tone={emailTone}
            employees={employees}
            payrollMonth={setupData.payrollMonth}
            onBack={() => setStep('validate')}
            onConfirm={handleConfirmAndSend}
            onToneChange={handleToneChange}
            onRegenerate={() => handleToneChange(emailTone)}
            onBodyChange={(body) => setEmailTemplate(prev => ({ ...prev, body }))}
            isLoading={createRun.isPending || createJobs.isPending}
            isRegenerating={generateEmail.isPending}
          />
        )}

        {step === 'send' && run && (
          <SendProgress
            jobs={jobs || []}
            stats={stats}
            runStatus={run.status}
            onRetryFailed={handleRetryFailed}
            isRetrying={retryFailed.isPending}
            isSending={isSending}
          />
        )}
      </div>
    </MainLayout>
  );
}
