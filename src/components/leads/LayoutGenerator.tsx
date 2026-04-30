import { useState } from 'react';
import { Wand2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SpaceCalculation } from '@/types';

interface LayoutGeneratorProps {
  spaceCalc?: SpaceCalculation | null;
}

export function LayoutGenerator({ spaceCalc }: LayoutGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [layout, setLayout] = useState<string | null>(null);

  if (!spaceCalc || spaceCalc.modules.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Complete the Space Calculator first to generate a Reki.
        </p>
      </div>
    );
  }

  const generateLayout = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation with a mock CAD-style layout
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate a simple SVG layout based on modules
    const svgLayout = generateMockCADLayout(spaceCalc);
    setLayout(svgLayout);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={generateLayout}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Reki
            </>
          )}
        </Button>
        
        {layout && (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>

      {layout && (
        <div className="rounded-lg border bg-card p-4">
          <div
            className="w-full aspect-video bg-muted/30 rounded flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: layout }}
          />
          <p className="mt-3 text-xs text-muted-foreground text-center">
            * Illustrative layout for feasibility discussion. Not to scale.
          </p>
        </div>
      )}
    </div>
  );
}

function generateMockCADLayout(spaceCalc: SpaceCalculation): string {
  const width = 800;
  const height = 450;
  const padding = 40;
  
  let elements = '';
  let x = padding;
  let y = padding;
  let maxRowHeight = 0;
  const cellWidth = 80;
  const cellHeight = 60;
  
  const colors: Record<string, string> = {
    workstation: '#3b82f6',
    cabin_small: '#f59e0b',
    cabin_large: '#f97316',
    meeting_room_small: '#10b981',
    meeting_room_large: '#059669',
    conference_room: '#06b6d4',
    phone_booth: '#8b5cf6',
    break_area: '#ec4899',
    reception: '#6366f1',
    server_room: '#64748b',
  };

  spaceCalc.modules.forEach((module) => {
    for (let i = 0; i < Math.min(module.quantity, 20); i++) {
      if (x + cellWidth > width - padding) {
        x = padding;
        y += maxRowHeight + 10;
        maxRowHeight = 0;
      }
      
      const color = colors[module.type] || '#94a3b8';
      const h = module.type.includes('conference') ? cellHeight * 1.5 : 
                module.type.includes('large') ? cellHeight * 1.2 : cellHeight;
      const w = module.type.includes('conference') ? cellWidth * 2 : 
                module.type.includes('large') ? cellWidth * 1.3 : cellWidth;
      
      elements += `
        <rect x="${x}" y="${y}" width="${w - 4}" height="${h - 4}" 
              fill="${color}" rx="4" opacity="0.8"/>
        <text x="${x + (w - 4) / 2}" y="${y + (h - 4) / 2 + 4}" 
              fill="white" font-size="8" text-anchor="middle" font-family="IBM Plex Mono">
          ${module.type.split('_')[0].substring(0, 3).toUpperCase()}
        </text>
      `;
      
      x += w + 6;
      maxRowHeight = Math.max(maxRowHeight, h);
    }
  });

  // Add legend
  let legendY = height - 30;
  let legendX = padding;
  elements += `<text x="${legendX}" y="${legendY}" fill="#64748b" font-size="10" font-family="IBM Plex Sans">Legend:</text>`;
  legendX += 50;
  
  Object.entries(colors).slice(0, 6).forEach(([type, color]) => {
    elements += `
      <rect x="${legendX}" y="${legendY - 10}" width="12" height="12" fill="${color}" rx="2"/>
      <text x="${legendX + 16}" y="${legendY}" fill="#64748b" font-size="9" font-family="IBM Plex Sans">
        ${type.replace('_', ' ')}
      </text>
    `;
    legendX += 100;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <text x="${width / 2}" y="25" fill="#1e293b" font-size="14" font-weight="600" text-anchor="middle" font-family="IBM Plex Sans">
        Office Layout - ${spaceCalc.total_carpet_area.toLocaleString()} sqft / ${spaceCalc.total_seats} seats
      </text>
      ${elements}
    </svg>
  `;
}
