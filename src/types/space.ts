export interface SpaceLibraryItem {
  id: string;
  name: string;
  category: string;
  width_ft: number | null;
  length_ft: number | null;
  area_sqft: number;
  seats: number;
  is_custom: boolean;
  is_standard: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface SelectedSpace {
  spaceId: string;
  name: string;
  category: string;
  quantity: number;
  areaEach: number;
  seats: number;
  totalArea: number;
}

export interface SpaceSelectionOutput {
  spaces: SelectedSpace[];
  totalArea: number;
  totalSeats: number;
}

export type SpaceCategory = 'All' | 'Cabin' | 'Workstation' | 'Cubicle' | 'Meeting / Conference' | 'Support' | 'Custom';

export const SPACE_CATEGORIES: SpaceCategory[] = [
  'All',
  'Cabin',
  'Workstation',
  'Cubicle',
  'Meeting / Conference',
  'Support',
  'Custom',
];
