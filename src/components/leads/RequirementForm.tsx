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
import type { Requirement } from '@/types';

const requirementSchema = z.object({
  city: z.string().min(1, 'City is required'),
  micro_market: z.string().optional(),
  target_seats: z.coerce.number().min(1, 'Target seats must be at least 1'),
  budget_per_seat: z.coerce.number().optional(),
  preferred_move_in: z.string().optional(),
  additional_notes: z.string().optional(),
});

type RequirementFormValues = z.infer<typeof requirementSchema>;

interface RequirementFormProps {
  requirement?: Requirement | null;
  leadId: string;
  defaultSeats?: number;
  onSubmit: (values: RequirementFormValues & { lead_id: string; id?: string }) => void;
  isLoading?: boolean;
}

export function RequirementForm({
  requirement,
  leadId,
  defaultSeats = 10,
  onSubmit,
  isLoading,
}: RequirementFormProps) {
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      city: requirement?.city ?? '',
      micro_market: requirement?.micro_market ?? '',
      target_seats: requirement?.target_seats ?? defaultSeats,
      budget_per_seat: requirement?.budget_per_seat ?? undefined,
      preferred_move_in: requirement?.preferred_move_in ?? '',
      additional_notes: requirement?.additional_notes ?? '',
    },
  });

  const handleSubmit = (values: RequirementFormValues) => {
    onSubmit({
      ...values,
      lead_id: leadId,
      id: requirement?.id,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="Mumbai" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="micro_market"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Micro-market</FormLabel>
                <FormControl>
                  <Input placeholder="BKC, Andheri East" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Seats *</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_per_seat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget per Seat (₹/month)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="20000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferred_move_in"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Move-in Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requirements..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Requirements'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
