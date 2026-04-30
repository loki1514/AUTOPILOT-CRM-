// Registry to track link positions for PDF export
// Links are registered with their bounding box relative to the slide canvas

export interface PDFLinkInfo {
  slideId: string;
  url: string;
  // Bounding box in pixels relative to 1920x1080 slide
  x: number;
  y: number;
  width: number;
  height: number;
}

class PDFLinkRegistry {
  private links: PDFLinkInfo[] = [];

  register(link: PDFLinkInfo) {
    // Remove existing link with same slideId and url to avoid duplicates
    this.links = this.links.filter(
      (l) => !(l.slideId === link.slideId && l.url === link.url)
    );
    this.links.push(link);
  }

  getLinksForSlide(slideId: string): PDFLinkInfo[] {
    return this.links.filter((l) => l.slideId === slideId);
  }

  clear() {
    this.links = [];
  }

  clearSlide(slideId: string) {
    this.links = this.links.filter((l) => l.slideId !== slideId);
  }
}

export const pdfLinkRegistry = new PDFLinkRegistry();
