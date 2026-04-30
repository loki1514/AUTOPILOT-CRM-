import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JobStatusBadge } from './StatusBadges';
import { Send, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PayslipJobWithEmployee } from '@/types/payslip';

interface SendProgressProps {
  jobs: PayslipJobWithEmployee[];
  stats: {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    progress: number;
  };
  runStatus: string;
  onRetryFailed: () => void;
  isRetrying?: boolean;
  isSending?: boolean;
}

export function SendProgress({
  jobs,
  stats,
  runStatus,
  onRetryFailed,
  isRetrying,
  isSending,
}: SendProgressProps) {
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const isComplete = runStatus === 'completed' || runStatus === 'partial' || runStatus === 'failed';

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending Payslips
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {runStatus === 'completed' ? 'All Sent' : 'Sending Complete'}
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Ready to Send
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSending 
              ? 'Emails are being sent one at a time...'
              : isComplete 
                ? `${stats.sent} of ${stats.total} emails delivered successfully`
                : 'Click send to begin delivering payslips'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{Math.round(stats.progress)}% Complete</span>
              <span>{stats.sent + stats.failed} / {stats.total}</span>
            </div>
            <Progress value={stats.progress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending + stats.processing}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs Table */}
      {failedJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Failed Jobs
              </CardTitle>
              <CardDescription>
                {failedJobs.length} email(s) failed to send
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={onRetryFailed}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry All ({failedJobs.length})
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.employee?.employee_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.employee?.employee_email}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-red-600">
                        {job.error_message || 'Unknown error'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {job.retry_count} / {job.max_retries}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>
            Status of each payslip email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    {job.employee?.employee_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.employee?.employee_email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.drive_file_name}
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.sent_at 
                      ? new Date(job.sent_at).toLocaleTimeString()
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
