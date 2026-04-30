import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FolderOpen } from 'lucide-react';
import { useSenderProfiles } from '@/hooks/useSenderProfiles';

const setupSchema = z.object({
  driveFolderUrl: z
    .string()
    .min(1, 'Google Drive folder URL is required')
    .refine(
      (url) => url.includes('drive.google.com') || /^[a-zA-Z0-9_-]+$/.test(url),
      'Please enter a valid Google Drive folder URL'
    ),
  payrollMonth: z.string().min(1, 'Payroll month is required'),
  senderName: z.string().min(1, 'Sender name is required'),
  senderEmail: z.string().email('Valid email required'),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface SetupFormProps {
  onSubmit: (data: SetupFormData) => Promise<void>;
  isLoading?: boolean;
}

// Generate month options (current month + 11 months back)
function getMonthOptions() {
  const options = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
}

export function SetupForm({ onSubmit, isLoading }: SetupFormProps) {
  const { profiles } = useSenderProfiles();
  const monthOptions = getMonthOptions();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      driveFolderUrl: '',
      payrollMonth: monthOptions[0]?.value || '',
      senderName: 'Autopilot HR',
      senderEmail: '',
    },
  });

  // Auto-fill sender email from profiles
  const handleProfileSelect = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      form.setValue('senderName', profile.name);
      form.setValue('senderEmail', profile.from_email);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          New Payslip Run
        </CardTitle>
        <CardDescription>
          Set up a new payslip distribution run by connecting to your Google Drive folder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="driveFolderUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Drive Folder</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/drive/folders/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the URL of the Drive folder containing payslip PDFs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payrollMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payroll Month</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>Sender Identity</Label>
              
              {profiles.length > 0 && (
                <div className="mb-4">
                  <Label className="text-sm text-muted-foreground">Use existing profile</Label>
                  <Select onValueChange={handleProfileSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sender profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} ({profile.from_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Autopilot HR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input placeholder="hr@yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Payslips →'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
