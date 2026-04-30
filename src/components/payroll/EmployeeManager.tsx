import { useState, useRef } from 'react';
import { usePayslipEmployees } from '@/hooks/usePayslipEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Plus, Upload, Pencil, Trash2, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { PayslipEmployee } from '@/types/payslip';

interface EmployeeFormData {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  department: string;
}

const initialFormData: EmployeeFormData = {
  employee_id: '',
  employee_name: '',
  employee_email: '',
  department: '',
};

export function EmployeeManager() {
  const {
    employees,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImportEmployees,
  } = usePayslipEmployees();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PayslipEmployee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({
          id: editingEmployee.id,
          ...formData,
        });
        setEditingEmployee(null);
      } else {
        await createEmployee.mutateAsync(formData);
      }

      setFormData(initialFormData);
      setIsAddOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (employee: PayslipEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      employee_name: employee.employee_name,
      employee_email: employee.employee_email,
      department: employee.department || '',
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEmployee.mutateAsync(id);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row');
        return;
      }

      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('email') || header.includes('name') || header.includes('id');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const parsedEmployees = dataLines.map((line, index) => {
        const values = parseCSVLine(line);
        
        if (values.length < 3) {
          throw new Error(`Row ${index + 2}: Expected at least 3 columns (ID, Name, Email)`);
        }

        return {
          employee_id: values[0].trim(),
          employee_name: values[1].trim(),
          employee_email: values[2].trim(),
          department: values[3]?.trim() || undefined,
        };
      });

      // Validate emails
      const invalidEmails = parsedEmployees.filter(emp => !isValidEmail(emp.employee_email));
      if (invalidEmails.length > 0) {
        toast.error(`Invalid emails found: ${invalidEmails.map(emp => emp.employee_email).slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`);
        return;
      }

      await bulkImportEmployees.mutateAsync(parsedEmployees);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse CSV');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleDialogChange = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      setEditingEmployee(null);
      setFormData(initialFormData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee List
            </CardTitle>
            <CardDescription>
              Manage employees who will receive payslips
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVImport}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={bulkImportEmployees.isPending}
            >
              {bulkImportEmployees.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import CSV
            </Button>
            <Dialog open={isAddOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEmployee ? 'Update employee details' : 'Add a new employee to receive payslips'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="EMP001"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee_name">Full Name</Label>
                      <Input
                        id="employee_name"
                        value={formData.employee_name}
                        onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee_email">Email</Label>
                      <Input
                        id="employee_email"
                        type="email"
                        value={formData.employee_email}
                        onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                        placeholder="john.doe@company.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Engineering"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createEmployee.isPending || updateEmployee.isPending}
                    >
                      {(createEmployee.isPending || updateEmployee.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingEmployee ? 'Save Changes' : 'Add Employee'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No employees added yet</p>
            <p className="text-sm">Add employees manually or import from CSV</p>
            <p className="text-xs mt-2 text-muted-foreground/70">
              CSV format: Employee ID, Full Name, Email, Department (optional)
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-sm">
                    {employee.employee_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {employee.employee_name}
                  </TableCell>
                  <TableCell>{employee.employee_email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.department || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {employee.employee_name}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(employee.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
