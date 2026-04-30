import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { pdfLinkRegistry } from './pdfLinkRegistry';

// 16:9 slide dimensions in pixels
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

// PDF dimensions for 16:9 ratio (in mm, using standard presentation size)
const PDF_WIDTH = 339.67; // 16:9 ratio in mm
const PDF_HEIGHT = 191.06;

// Quality presets for PDF export
export type PDFQuality = 'high' | 'medium' | 'low';

export const QUALITY_SETTINGS: Record<PDFQuality, { scale: number; jpegQuality: number; label: string; sizeEstimate: string }> = {
  high: { scale: 2, jpegQuality: 0.90, label: 'High', sizeEstimate: '~20-35 MB' },
  medium: { scale: 1.5, jpegQuality: 0.80, label: 'Medium', sizeEstimate: '~10-18 MB' },
  low: { scale: 1.25, jpegQuality: 0.65, label: 'Low', sizeEstimate: '~5-10 MB' },
};

export async function exportBrochureToPDF(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  // Capture at 2x scale for quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_WIDTH, PDF_HEIGHT],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT);
  pdf.save(`${filename}.pdf`);
}

// Helper to wait for all images in an element to load
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  await Promise.all(promises);
}

export async function exportMultiSlideBrochure(
  slideElementIds: string[],
  filename: string,
  quality: PDFQuality = 'medium',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const settings = QUALITY_SETTINGS[quality];
  
  // Wait for fonts to be ready before any capture
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_WIDTH, PDF_HEIGHT],
  });

  let pagesAdded = 0;
  const totalSlides = slideElementIds.length;

  for (let i = 0; i < totalSlides; i++) {
    const elementId = slideElementIds[i];
    const element = document.getElementById(elementId);
    
    // Report progress
    onProgress?.(i + 1, totalSlides);
    
    if (!element) {
      console.warn(`Slide element not found: ${elementId}`);
      continue;
    }

    // Wait for images to load before capture
    await waitForImages(element);

    try {
      const canvas = await html2canvas(element, {
        scale: settings.scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        windowWidth: SLIDE_WIDTH,
        windowHeight: SLIDE_HEIGHT,
        onclone: (clonedDoc: Document) => {
          const clonedEl = clonedDoc.getElementById(elementId);
          if (clonedEl) {
            // Add pdf-root class to enable PDF-safe CSS overrides
            clonedEl.classList.add('pdf-root');
            
            // Override inline styles on info card values to prevent clipping
            const infoValues = clonedEl.querySelectorAll('.ps-info-value');
            infoValues.forEach((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.maxHeight = 'none';
              htmlEl.style.overflow = 'visible';
              htmlEl.style.lineHeight = '1.45';
            });
          }
        },
      });

      // Use JPEG with quality setting for compression
      const imgData = canvas.toDataURL('image/jpeg', settings.jpegQuality);

      if (pagesAdded > 0) {
        pdf.addPage([PDF_WIDTH, PDF_HEIGHT], 'landscape');
      }
      // Use JPEG format with FAST compression
      pdf.addImage(imgData, 'JPEG', 0, 0, PDF_WIDTH, PDF_HEIGHT, undefined, 'FAST');
      
      // Add clickable links from registry
      const links = pdfLinkRegistry.getLinksForSlide(elementId);
      links.forEach((link) => {
        // Convert pixel coordinates to PDF mm coordinates
        const xMm = (link.x / SLIDE_WIDTH) * PDF_WIDTH;
        const yMm = (link.y / SLIDE_HEIGHT) * PDF_HEIGHT;
        const widthMm = (link.width / SLIDE_WIDTH) * PDF_WIDTH;
        const heightMm = (link.height / SLIDE_HEIGHT) * PDF_HEIGHT;
        
        pdf.link(xMm, yMm, widthMm, heightMm, { url: link.url });
      });
      
      pagesAdded++;
    } catch (err) {
      console.error(`Failed to capture slide: ${elementId}`, err);
    }
  }

  if (pagesAdded === 0) {
    throw new Error('No slides were captured');
  }

  pdf.save(`${filename}.pdf`);
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}
