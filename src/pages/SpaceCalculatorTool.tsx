import { useState, useMemo } from 'react';
import { Plus, Calculator } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { SpaceSearchBar } from '@/components/space/SpaceSearchBar';
import { CategoryFilter } from '@/components/space/CategoryFilter';
import { SpaceLibraryCard } from '@/components/space/SpaceLibraryCard';
import { SelectedSpacesList } from '@/components/space/SelectedSpacesList';
import { CustomSpaceDialog } from '@/components/space/CustomSpaceDialog';
import { useSpaceLibrary } from '@/hooks/useSpaceLibrary';
import { useSpaceSelection } from '@/hooks/useSpaceSelection';
import { SpaceCategory } from '@/types/space';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpaceCalculatorTool() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<SpaceCategory>('All');

  const { data: spaces, isLoading } = useSpaceLibrary({ searchQuery, category });
  const {
    selectedSpaces,
    addSpace,
    removeSpace,
    updateQuantity,
    clearAll,
    copyToClipboard,
    totalArea,
    totalSeats,
    totalElements,
  } = useSpaceSelection();

  return (
    <MainLayout>
      <div className="mx-auto max-w-[90rem] space-y-8 px-1">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
                Space Calculator
              </h1>
              <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
                Build your space requirement in minutes
              </p>
            </div>
          </div>
          <CustomSpaceDialog
            trigger={
              <Button size="lg" className="gap-2 rounded-xl px-6 font-medium shadow-sm">
                <Plus className="h-5 w-5" />
                Customize Space
              </Button>
            }
          />
        </header>

        {/* Search and Filters */}
        <section className="space-y-4">
          <SpaceSearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryFilter selected={category} onSelect={setCategory} />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Space Library */}
          <section className="xl:col-span-2">
            <div className="mb-4 flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-foreground">Space Library</h2>
              {spaces && (
                <span className="text-sm text-muted-foreground">
                  {spaces.length} {spaces.length === 1 ? 'space' : 'spaces'}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[5.5rem] w-full rounded-xl" />
                ))}
              </div>
            ) : spaces && spaces.length > 0 ? (
              <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 22rem)' }}>
                {spaces.map((space, index) => (
                  <div
                    key={space.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <SpaceLibraryCard space={space} onAdd={addSpace} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Calculator className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-4 text-muted-foreground">
                  {searchQuery || category !== 'All'
                    ? 'No spaces match your search criteria'
                    : 'No spaces available'}
                </p>
                <CustomSpaceDialog
                  trigger={
                    <Button variant="outline" className="gap-2 rounded-xl">
                      <Plus className="h-4 w-4" />
                      Create Custom Space
                    </Button>
                  }
                />
              </div>
            )}
          </section>

          {/* Selected Spaces Panel */}
          <aside className="xl:col-span-1">
            <div className="sticky top-6">
              <SelectedSpacesList
                spaces={selectedSpaces}
                totalArea={totalArea}
                totalSeats={totalSeats}
                totalElements={totalElements}
                onUpdateQuantity={updateQuantity}
                onRemove={removeSpace}
                onClear={clearAll}
                onCopyJson={copyToClipboard}
              />
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
