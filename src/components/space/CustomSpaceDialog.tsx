import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, ImagePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateCustomSpace } from '@/hooks/useCreateCustomSpace';

const CATEGORIES = ['Cabin', 'Workstation', 'Cubicle', 'Meeting / Conference', 'Support'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  width_ft: z.number().positive('Width must be positive').optional(),
  length_ft: z.number().positive('Length must be positive').optional(),
  area_sqft: z.number().positive('Area must be positive'),
  seats: z.number().min(0, 'Seats cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

interface CustomSpaceDialogProps {
  trigger: React.ReactNode;
}

export function CustomSpaceDialog({ trigger }: CustomSpaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { mutate: createSpace, isPending } = useCreateCustomSpace();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      width_ft: undefined,
      length_ft: undefined,
      area_sqft: 0,
      seats: 1,
    },
  });

  const width = form.watch('width_ft');
  const length = form.watch('length_ft');

  // Auto-calculate area from width × length
  useEffect(() => {
    if (width && length) {
      form.setValue('area_sqft', parseFloat((width * length).toFixed(2)));
    }
  }, [width, length, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      return;
    }

    const newImages = [...images, ...files].slice(0, 3);
    setImages(newImages);

    const urls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newUrls);
  };

  const onSubmit = (data: FormData) => {
    createSpace(
      {
        name: data.name,
        category: data.category,
        area_sqft: data.area_sqft,
        seats: data.seats,
        width_ft: data.width_ft ?? null,
        length_ft: data.length_ft ?? null,
        images,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          setImages([]);
          setPreviewUrls([]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Custom Space</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[0.8125rem]">Space Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Executive Suite A"
                      className="h-11 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[0.8125rem]">Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[0.8125rem]">Width (ft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10"
                        className="h-11 rounded-lg"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[0.8125rem]">Length (ft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="12"
                        className="h-11 rounded-lg"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area_sqft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[0.8125rem]">Area (sqft) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="120"
                        className="h-11 rounded-lg"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[0.8125rem]">Seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="1"
                        className="h-11 rounded-lg"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-[0.8125rem]">Reference Images (optional, max 3)</Label>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {previewUrls.map((url, index) => (
                  <div key={index} className="group relative h-20 w-20">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary hover:bg-primary/5">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-[0.625rem] text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-lg px-5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="rounded-lg px-5">
                {isPending ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
