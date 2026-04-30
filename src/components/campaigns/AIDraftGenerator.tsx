import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, RotateCcw, Check } from 'lucide-react';
import { useEmailTemplate } from '@/hooks/useEmailTemplate';
import { EmailBlockPreview } from './EmailBlockPreview';
import { EmailBlock } from '@/types/email';

interface AIDraftGeneratorProps {
  campaignId: string;
}

export function AIDraftGenerator({ campaignId }: AIDraftGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState<string | null>(null);
  const [generatedBlocks, setGeneratedBlocks] = useState<EmailBlock[] | null>(null);

  const { template, generateDraft, saveTemplate } = useEmailTemplate(campaignId);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const result = await generateDraft.mutateAsync({
      prompt: prompt.trim(),
      targetAudience: targetAudience.trim() || undefined,
    });

    setGeneratedSubject(result.subject);
    setGeneratedBlocks(result.blocks);
  };

  const handleUseDraft = async () => {
    if (!generatedSubject || !generatedBlocks) return;

    await saveTemplate.mutateAsync({
      subject: generatedSubject,
      blocks: generatedBlocks,
    });

    // Clear generated state after saving
    setGeneratedSubject(null);
    setGeneratedBlocks(null);
    setPrompt('');
    setTargetAudience('');
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const isGenerating = generateDraft.isPending;
  const isSaving = saveTemplate.isPending;
  const hasGenerated = generatedSubject !== null && generatedBlocks !== null;
  const hasExistingTemplate = !!template;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe your email</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., Write an email announcing our new premium office spaces in Mumbai with flexible lease terms and modern amenities..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience (optional)</Label>
          <Input
            id="audience"
            placeholder="e.g., Real estate professionals, startup founders, enterprise clients"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI is writing your email...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Draft
            </>
          )}
        </Button>
      </div>

      {/* Generated Preview */}
      {hasGenerated && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Draft</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating || isSaving}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={handleUseDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Use This Draft
                </Button>
              </div>
            </div>
            <EmailBlockPreview
              subject={generatedSubject}
              blocks={generatedBlocks}
            />
          </CardContent>
        </Card>
      )}

      {/* Existing Template Preview */}
      {!hasGenerated && hasExistingTemplate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Draft</h3>
              <p className="text-sm text-muted-foreground">
                Generate a new draft above to replace this one
              </p>
            </div>
            <EmailBlockPreview
              subject={template.subject}
              blocks={template.blocks}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
