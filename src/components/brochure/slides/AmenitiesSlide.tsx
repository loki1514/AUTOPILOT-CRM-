import { BrochureState } from '@/types/brochure';
import { SlideContainer } from './SlideContainer';
import { SlideHeader } from './SlideHeader';
import {
  Car,
  UtensilsCrossed,
  Zap,
  Dumbbell,
  Users,
  ArrowUp,
  Shield,
  Clock,
  Flame,
  Building,
  Coffee,
  Server,
  LucideIcon,
} from 'lucide-react';

interface AmenitiesSlideProps {
  id?: string;
  state: BrochureState;
}

const amenityIcons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  Parking: { icon: Car, color: '#3b82f6', bg: '#dbeafe' },
  Cafeteria: { icon: UtensilsCrossed, color: '#f97316', bg: '#ffedd5' },
  'Power Backup': { icon: Zap, color: '#eab308', bg: '#fef9c3' },
  Gym: { icon: Dumbbell, color: '#ef4444', bg: '#fee2e2' },
  'Conference Rooms': { icon: Users, color: '#8b5cf6', bg: '#ede9fe' },
  'High-Speed Lifts': { icon: ArrowUp, color: '#14b8a6', bg: '#ccfbf1' },
  'CCTV Security': { icon: Shield, color: '#22c55e', bg: '#dcfce7' },
  '24/7 Access': { icon: Clock, color: '#6366f1', bg: '#e0e7ff' },
  'Fire Safety': { icon: Flame, color: '#f97316', bg: '#ffedd5' },
  Reception: { icon: Building, color: '#64748b', bg: '#f1f5f9' },
  Pantry: { icon: Coffee, color: '#a855f7', bg: '#f3e8ff' },
  'Server Room': { icon: Server, color: '#0ea5e9', bg: '#e0f2fe' },
};

export function AmenitiesSlide({ id, state }: AmenitiesSlideProps) {
  const amenities = state.amenities;

  if (amenities.length === 0) {
    return (
      <SlideContainer id={id}>
        <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl text-muted-foreground">
            No amenities selected
          </p>
        </div>
      </SlideContainer>
    );
  }

  return (
    <SlideContainer id={id}>
      <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />

      <div className="flex flex-col h-full">
        <h2 className="text-4xl font-bold text-foreground mb-8">
          Amenities & Features
        </h2>

        <div className="grid grid-cols-4 gap-6 flex-1 content-start">
          {amenities.map((amenity) => {
            const iconConfig = amenityIcons[amenity] || {
              icon: Building,
              color: '#64748b',
              bg: '#f1f5f9',
            };
            const Icon = iconConfig.icon;

            return (
              <div
                key={amenity}
                className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: iconConfig.bg }}
                >
                  <Icon className="h-7 w-7" style={{ color: iconConfig.color }} />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {amenity}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SlideContainer>
  );
}
