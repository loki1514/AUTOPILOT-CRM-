import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CcBccConfigProps {
  ccEmails: string[];
  bccEmails: string[];
  onCcChange: (emails: string[]) => void;
  onBccChange: (emails: string[]) => void;
  disabled?: boolean;
}

function EmailInput({
  label,
  description,
  emails,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = () => {
    const trimmed = inputValue.trim().replace(/,$/g, '');
    if (trimmed && isValidEmail(trimmed) && !emails.includes(trimmed)) {
      onChange([...emails, trimmed]);
      setInputValue('');
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
        {emails.map((email) => (
          <Badge key={email} variant="secondary" className="flex items-center gap-1">
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addEmail}
          placeholder={emails.length === 0 ? 'Enter email addresses...' : ''}
          className="flex-1 min-w-[200px] border-0 focus-visible:ring-0 p-0 h-auto"
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add multiple emails
      </p>
    </div>
  );
}

export function CcBccConfig({
  ccEmails,
  bccEmails,
  onCcChange,
  onBccChange,
  disabled,
}: CcBccConfigProps) {
  return (
    <div className="space-y-6">
      <EmailInput
        label="CC (Carbon Copy)"
        description="Recipients visible to all email recipients"
        emails={ccEmails}
        onChange={onCcChange}
        disabled={disabled}
      />

      <EmailInput
        label="BCC (Blind Carbon Copy)"
        description="Recipients hidden from other email recipients (for internal use)"
        emails={bccEmails}
        onChange={onBccChange}
        disabled={disabled}
      />
    </div>
  );
}
