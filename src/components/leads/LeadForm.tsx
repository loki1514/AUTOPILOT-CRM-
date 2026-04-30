import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead, LeadStage } from '@/types';

const leadSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  company: z.string().min(1, 'Company is required'),
  headcount: z.coerce.number().min(1, 'Headcount must be at least 1'),
  location: z.string().optional(),
  budget_min: z.coerce.number().optional(),
  budget_max: z.coerce.number().optional(),
  timeline: z.string().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'closed', 'lost']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LeadForm({ lead, onSubmit, onCancel, isLoading }: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      client_name: lead?.client_name ?? '',
      company: lead?.company ?? '',
      headcount: lead?.headcount ?? 10,
      location: lead?.location ?? '',
      budget_min: lead?.budget_min ?? undefined,
      budget_max: lead?.budget_max ?? undefined,
      timeline: lead?.timeline ?? '',
      stage: lead?.stage ?? 'lead',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      notes: lead?.notes ?? '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@acme.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+91 98765 43210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headcount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Headcount *</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Mumbai, BKC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Min (₹/seat)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="15000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Max (₹/seat)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline</FormLabel>
                <FormControl>
                  <Input placeholder="Q2 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this lead..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
