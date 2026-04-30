import { EmployeeFileMapping, ValidationIssue } from '@/types/payslip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfidenceBadge } from './StatusBadges';
import { CheckCircle, XCircle, AlertTriangle, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

interface ValidationTableProps {
  mappings: EmployeeFileMapping[];
  issues: ValidationIssue[];
  isValid: boolean;
  onBack: () => void;
  onContinue: () => void;
  onConfirmLowConfidence?: (employeeId: string) => void;
}

export function ValidationTable({
  mappings,
  issues,
  isValid,
  onBack,
  onContinue,
  onConfirmLowConfidence,
}: ValidationTableProps) {
  const matchedCount = mappings.filter(m => m.status === 'matched').length;
  const lowConfidenceCount = mappings.filter(m => m.status === 'low_confidence').length;
  const missingCount = mappings.filter(m => m.status === 'missing').length;

  const getStatusIcon = (status: EmployeeFileMapping['status']) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low_confidence':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      {!isValid ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Issues Found</AlertTitle>
          <AlertDescription>
            {missingCount > 0 && `${missingCount} employee(s) have no matching payslip file. `}
            {lowConfidenceCount > 0 && `${lowConfidenceCount} file(s) need manual confirmation. `}
            Please fix these issues before proceeding.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>All Clear</AlertTitle>
          <AlertDescription>
            All {matchedCount} employees have been matched to their payslip files.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
              <div className="text-sm text-muted-foreground">Matched</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{lowConfidenceCount}</div>
              <div className="text-sm text-muted-foreground">Low Confidence</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{missingCount}</div>
              <div className="text-sm text-muted-foreground">Missing</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Employee-File Mapping
          </CardTitle>
          <CardDescription>
            Review the automatic matching between employees and payslip files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>PDF File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.employeeId}>
                  <TableCell className="font-medium">{mapping.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">{mapping.employeeEmail}</TableCell>
                  <TableCell>
                    {mapping.driveFileName ? (
                      <span className="text-sm">{mapping.driveFileName}</span>
                    ) : (
                      <span className="text-sm text-red-500">No file found</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(mapping.status)}
                      {mapping.confidence > 0 && (
                        <ConfidenceBadge confidence={mapping.confidence} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.status === 'low_confidence' && onConfirmLowConfidence && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConfirmLowConfidence(mapping.employeeId)}
                      >
                        Confirm
                      </Button>
                    )}
                    {mapping.status === 'missing' && (
                      <Badge variant="outline" className="text-xs">
                        Fix Required
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instructions for fixing issues */}
      {!isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Fix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• <strong>Missing files:</strong> Rename a PDF to include the employee's name, or upload it to the Drive folder</p>
            <p>• <strong>Low confidence:</strong> Click "Confirm" if the match is correct, or rename the file for better matching</p>
            <p>• <strong>Invalid email:</strong> Update the employee's email address in the employee list</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onContinue} disabled={!isValid}>
          Continue to Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
