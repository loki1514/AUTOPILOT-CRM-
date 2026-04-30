import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Paperclip, ArrowLeft, Send, Loader2, RefreshCw } from 'lucide-react';
import { PayslipEmployee } from '@/types/payslip';

interface EmailPreviewProps {
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  tone: 'formal' | 'friendly';
  employees: PayslipEmployee[];
  payrollMonth: string;
  onBack: () => void;
  onConfirm: () => void;
  onToneChange: (tone: 'formal' | 'friendly') => void;
  onRegenerate: () => void;
  onBodyChange: (body: string) => void;
  isLoading?: boolean;
  isRegenerating?: boolean;
}

export function EmailPreview({
  subject,
  body,
  senderName,
  senderEmail,
  tone,
  employees,
  payrollMonth,
  onBack,
  onConfirm,
  onToneChange,
  onRegenerate,
  onBodyChange,
  isLoading,
  isRegenerating,
}: EmailPreviewProps) {
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);

  // Personalize the template with selected employee's name
  const personalizedBody = body.replace(/\{\{employee_name\}\}/g, selectedEmployee?.employee_name || 'Employee');
  const personalizedSubject = subject.replace(/\{\{employee_name\}\}/g, selectedEmployee?.employee_name || 'Employee');

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
          </CardTitle>
          <CardDescription>
            Preview how your emails will look before sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Preview for employee</Label>
              <Select
                value={selectedEmployee?.id}
                onValueChange={(id) => {
                  const emp = employees.find(e => e.id === id);
                  if (emp) setSelectedEmployee(emp);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => onToneChange(v as 'formal' | 'friendly')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="rounded-lg border bg-background p-6 shadow-sm space-y-4">
            {/* Email Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                <span className="font-medium">{personalizedSubject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">From:</span>
                <span>{senderName} &lt;{senderEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">To:</span>
                <span>{selectedEmployee?.employee_email}</span>
              </div>
            </div>

            <Separator />

            {/* Email Body */}
            <div className="space-y-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {personalizedBody}
              </div>
            </div>

            <Separator />

            {/* Attachment */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>
                {selectedEmployee?.employee_name.replace(/\s+/g, '_')}_Payslip_{payrollMonth}.pdf
              </span>
              <Badge variant="secondary" className="text-xs">PDF</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Body */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Template</CardTitle>
          <CardDescription>
            Use {'{{employee_name}}'} as a placeholder for the employee's name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Jobs...
            </>
          ) : (
            <>
              Confirm & Send
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
