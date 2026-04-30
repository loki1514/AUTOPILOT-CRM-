import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ReplyToMode } from '@/types/email';

interface ReplyToConfigProps {
  mode: ReplyToMode;
  email: string;
  onModeChange: (mode: ReplyToMode) => void;
  onEmailChange: (email: string) => void;
  disabled?: boolean;
}

export function ReplyToConfig({
  mode,
  email,
  onModeChange,
  onEmailChange,
  disabled,
}: ReplyToConfigProps) {
  return (
    <div className="space-y-4">
      <Label>Reply-To Configuration</Label>
      
      <RadioGroup
        value={mode}
        onValueChange={(v: ReplyToMode) => onModeChange(v)}
        disabled={disabled}
        className="space-y-3"
      >
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="shared" id="reply-shared" className="mt-1" />
          <div className="space-y-1">
            <label
              htmlFor="reply-shared"
              className="text-sm font-medium cursor-pointer"
            >
              Shared Inbox
            </label>
            <p className="text-xs text-muted-foreground">
              All replies go to a single shared email (e.g., bd@worksquare.in)
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <RadioGroupItem value="individual" id="reply-individual" className="mt-1" />
          <div className="space-y-1">
            <label
              htmlFor="reply-individual"
              className="text-sm font-medium cursor-pointer"
            >
              Individual User
            </label>
            <p className="text-xs text-muted-foreground">
              Replies route to the logged-in user's email (future feature)
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <RadioGroupItem value="custom" id="reply-custom" className="mt-1" />
          <div className="space-y-1">
            <label
              htmlFor="reply-custom"
              className="text-sm font-medium cursor-pointer"
            >
              Custom Address
            </label>
            <p className="text-xs text-muted-foreground">
              Specify a custom inbox for replies
            </p>
          </div>
        </div>
      </RadioGroup>

      {(mode === 'shared' || mode === 'custom') && (
        <div className="space-y-2 pl-6">
          <Label htmlFor="reply-email">Reply-To Email</Label>
          <Input
            id="reply-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="replies@example.com"
            disabled={disabled}
          />
        </div>
      )}

      {mode === 'individual' && (
        <div className="pl-6 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          Individual reply routing will use the logged-in user's email address.
          This feature is coming soon.
        </div>
      )}
    </div>
  );
}
