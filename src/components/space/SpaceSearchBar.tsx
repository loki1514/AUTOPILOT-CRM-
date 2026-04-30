import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SpaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SpaceSearchBar({ value, onChange }: SpaceSearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search spaces... (try 'conf', 'cabin', 'ws')"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border-border bg-card pl-11 pr-11 text-[0.9375rem] shadow-sm transition-shadow duration-200 placeholder:text-muted-foreground/60 focus:shadow-md"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
