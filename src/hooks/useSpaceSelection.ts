import { useState, useCallback, useMemo, useEffect } from 'react';
import { SelectedSpace, SpaceSelectionOutput, SpaceLibraryItem } from '@/types/space';

const STORAGE_KEY = 'bd-space-selection';

export function useSpaceSelection() {
  const [selectedSpaces, setSelectedSpaces] = useState<SelectedSpace[]>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSpaces));
  }, [selectedSpaces]);

  const addSpace = useCallback((space: SpaceLibraryItem) => {
    setSelectedSpaces((prev) => {
      const existing = prev.find((s) => s.spaceId === space.id);
      if (existing) {
        // Increment quantity if already selected
        return prev.map((s) =>
          s.spaceId === space.id
            ? { ...s, quantity: s.quantity + 1, totalArea: (s.quantity + 1) * s.areaEach }
            : s
        );
      }
      // Add new space with quantity 1
      return [
        ...prev,
        {
          spaceId: space.id,
          name: space.name,
          category: space.category,
          quantity: 1,
          areaEach: space.area_sqft,
          seats: space.seats,
          totalArea: space.area_sqft,
        },
      ];
    });
  }, []);

  const removeSpace = useCallback((spaceId: string) => {
    setSelectedSpaces((prev) => prev.filter((s) => s.spaceId !== spaceId));
  }, []);

  const updateQuantity = useCallback((spaceId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedSpaces((prev) =>
      prev.map((s) =>
        s.spaceId === spaceId
          ? { ...s, quantity, totalArea: quantity * s.areaEach }
          : s
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSpaces([]);
  }, []);

  const output: SpaceSelectionOutput = useMemo(() => {
    const totalArea = selectedSpaces.reduce((sum, s) => sum + s.totalArea, 0);
    const totalSeats = selectedSpaces.reduce((sum, s) => sum + s.quantity * s.seats, 0);
    return {
      spaces: selectedSpaces,
      totalArea,
      totalSeats,
    };
  }, [selectedSpaces]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
  }, [output]);

  return {
    selectedSpaces,
    addSpace,
    removeSpace,
    updateQuantity,
    clearAll,
    output,
    copyToClipboard,
    totalArea: output.totalArea,
    totalSeats: output.totalSeats,
    totalElements: selectedSpaces.reduce((sum, s) => sum + s.quantity, 0),
  };
}
