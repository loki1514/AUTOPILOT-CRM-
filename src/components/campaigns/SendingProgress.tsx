import { CheckCircle, AlertCircle, Loader2, Send, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SendingProgressProps {
  status: 'idle' | 'sending' | 'complete' | 'error';
  sent: number;
  failed: number;
  total: number;
  errors?: string[];
}

export function SendingProgress({
  status,
  sent,
  failed,
  total,
  errors = [],
}: SendingProgressProps) {
  const progress = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;

  if (status === 'idle') {
    return null;
  }

  return (
    <Card className={status === 'error' ? 'border-destructive' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {status === 'sending' && (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Sending Campaign...
            </>
          )}
          {status === 'complete' && (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Campaign Sent
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-5 w-5 text-destructive" />
              Sending Error
            </>
          )}
        </CardTitle>
        <CardDescription>
          {status === 'sending' && 'Please wait while emails are being sent...'}
          {status === 'complete' && 'All emails have been processed.'}
          {status === 'error' && 'There was an error during sending.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total: {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sent: {sent}
            </Badge>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Failed: {failed}
              </Badge>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <p className="font-medium mb-1">Errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.slice(0, 5).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
              {errors.length > 5 && (
                <li className="text-muted-foreground">
                  ...and {errors.length - 5} more errors
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Link to Outbox */}
        {status === 'complete' && (
          <div className="pt-2 border-t">
            <a
              href="/outbox"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              View in Outbox for delivery verification
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
