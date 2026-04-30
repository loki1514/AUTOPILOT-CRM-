import { User, Mail } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSenderProfiles } from '@/hooks/useSenderProfiles';
import type { SenderProfile } from '@/types/email';

interface SenderProfileSelectorProps {
  value: string | null;
  onChange: (profileId: string | null) => void;
  disabled?: boolean;
}

export function SenderProfileSelector({ value, onChange, disabled }: SenderProfileSelectorProps) {
  const { activeProfiles, isLoading } = useSenderProfiles();

  const selectedProfile = activeProfiles.find((p) => p.id === value);

  return (
    <div className="space-y-2">
      <Label>Sender Profile</Label>
      <Select
        value={value || ''}
        onValueChange={(v) => onChange(v || null)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a sender profile">
            {selectedProfile && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {selectedProfile.name}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {activeProfiles.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No active profiles available
            </div>
          ) : (
            activeProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.from_email}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedProfile && (
        <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">From:</span>
            <span>
              {selectedProfile.name} &lt;{selectedProfile.from_email}&gt;
            </span>
          </div>
          {selectedProfile.default_reply_to_email && (
            <div className="text-muted-foreground">
              Reply-To: {selectedProfile.default_reply_to_email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
