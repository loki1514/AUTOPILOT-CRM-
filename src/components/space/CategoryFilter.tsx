import { cn } from '@/lib/utils';
import { SpaceCategory, SPACE_CATEGORIES } from '@/types/space';

interface CategoryFilterProps {
  selected: SpaceCategory;
  onSelect: (category: SpaceCategory) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPACE_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-all duration-200',
            selected === category
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
