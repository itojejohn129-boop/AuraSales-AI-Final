import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { getDashboardLocaleCopy, type DashboardPdfLabels } from "@/lib/i18n/dashboardCopy";

type PdfFontPreset = {
  family: string;
  fileName: string;
  url: string;
  style: "normal";
};

type PdfDocument = jsPDF & {
  getFontList?: () => Record<string, unknown>;
  lastAutoTable?: { finalY?: number };
};

const PDF_FONT_PRESETS = {
  latin: {
    family: "AuraPdfLatin",
    fileName: "tahoma.ttf",
    url: "/pdf-fonts/tahoma.ttf",
    style: "normal",
  },
  cjk: {
    family: "AuraPdfCjk",
    fileName: "msgothic.ttc",
    url: "/pdf-fonts/msgothic.ttc",
    style: "normal",
  },
  korean: {
    family: "AuraPdfKorean",
    fileName: "malgun.ttf",
    url: "/pdf-fonts/malgun.ttf",
    style: "normal",
  },
  devanagari: {
    family: "AuraPdfDevanagari",
    fileName: "Nirmala.ttc",
    url: "/pdf-fonts/Nirmala.ttc",
    style: "normal",
  },
} as const satisfies Record<string, PdfFontPreset>;

const EMBEDDED_FONT_CACHE = new Map<string, Promise<string>>();

function normalizePdfText(input: string): string {
  return String(input ?? "")
    .replace(/\u20A6/g, "NGN")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}

function formatPdfNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value).replace(/[\u00A0\u202F]/g, " ");
}

function resolvePdfFontPreset(locale: string): PdfFontPreset {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("zh") || normalized.startsWith("ja")) return PDF_FONT_PRESETS.cjk;
  if (normalized.startsWith("ko")) return PDF_FONT_PRESETS.korean;
  if (normalized.startsWith("hi")) return PDF_FONT_PRESETS.devanagari;
  return PDF_FONT_PRESETS.latin;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function ensurePdfFont(doc: jsPDF, preset: PdfFontPreset): Promise<{ family: string; style: "normal" }> {
  try {
    const fontList = (doc as PdfDocument).getFontList?.() ?? {};
    if (fontList[preset.family]) {
      return { family: preset.family, style: preset.style };
    }

    if (!EMBEDDED_FONT_CACHE.has(preset.fileName)) {
      EMBEDDED_FONT_CACHE.set(
        preset.fileName,
        fetch(preset.url)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to load ${preset.fileName}`);
            }
            const buffer = await response.arrayBuffer();
            return arrayBufferToBase64(buffer);
          })
          .catch(() => "")
      );
    }

    const fontBase64 = await EMBEDDED_FONT_CACHE.get(preset.fileName)!;
    if (fontBase64) {
      doc.addFileToVFS(preset.fileName, fontBase64);
      doc.addFont(preset.fileName, preset.family, preset.style);
    }
  } catch {
    // Fall back to built-in fonts if embedded fonts cannot be loaded.
  }

  return { family: preset.family, style: preset.style };
}

interface ExportPDFOptions {
  summaryText?: string;
  kpis?: Array<{ label: string; value: string | number; growth?: string | number }>;
  chartSelectors?: string[];
  chatHistory?: Array<{ role: string; content: string }>;
  companyName?: string;
  websiteUrl?: string;
  locale?: string;
  labels?: Partial<DashboardPdfLabels>;
}

export async function exportDetailedPDF({
  summaryText = '',
  kpis = [],
  chartSelectors = [],
  chatHistory = [],
  companyName = 'AuraSales',
  websiteUrl = 'https://aurasales.com',
  locale = 'en',
  labels = {},
}: ExportPDFOptions) {
  const copy = { ...getDashboardLocaleCopy(locale).pdf, ...labels };
  // Initialize PDF document
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const pdfFont = await ensurePdfFont(doc, resolvePdfFontPreset(locale));

  // Set default font
  doc.setFont(pdfFont.family, pdfFont.style);

  // ======== PAGE 1: TITLE & EXECUTIVE SUMMARY ========
  let y = margin;

  // Header: Company Name
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Deep Navy
  doc.text(normalizePdfText(companyName), margin, y);
  y += 10;

  // Horizontal separator line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Top-right corner: Report metadata
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate gray
  const reportDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  doc.text(
    normalizePdfText(`${copy.reportGenerated}: ${reportDate}`),
    pageWidth - margin - 50,
    margin + 2
  );
  
  // Confidential badge
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38); // Red
  doc.text(normalizePdfText(copy.confidential), pageWidth - margin - 25, margin + 8);

  y = margin + 28;

  // Section 1: Executive Sales Analysis
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont(pdfFont.family, pdfFont.style);
  doc.text(normalizePdfText(copy.executiveSalesAnalysis), margin, y);
  y += 8;

  // Format and wrap the summary text
  const safeSummary = normalizePdfText(
    normalizePdfText(summaryText || 'No executive analysis available.')
  );
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont(pdfFont.family, pdfFont.style);
  const summaryLines = doc.splitTextToSize(safeSummary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5.5 + 8;

  // Section 2: Key Metrics Table
  if (kpis && kpis.length > 0) {
    if (y + 50 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(pdfFont.family, pdfFont.style);
    doc.text(normalizePdfText(copy.keyPerformanceIndicators), margin, y);
    y += 6;

    // Build table with Metric, Value, and Growth %
    const tableHead = [copy.metric, copy.value, copy.growth].map(normalizePdfText);
    const tableBody = kpis.map((k) => [
      normalizePdfText(String(k.label)),
      typeof k.value === 'number' ? formatPdfNumber(k.value, locale) : normalizePdfText(String(k.value)),
      k.growth ? normalizePdfText(`${k.growth}%`) : 'N/A',
    ]);

    autoTable(doc, {
      startY: y,
      head: [tableHead],
      body: tableBody,
      theme: 'striped',
      styles: {
        font: pdfFont.family,
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42], // Deep Navy
        textColor: [255, 255, 255], // White
        fontStyle: 'normal',
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249], // Light slate
      },
      bodyStyles: {
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as PdfDocument).lastAutoTable?.finalY ?? y + 30;
    y += 8;
  }

  // Section 3: Visual Charts
  if (chartSelectors && chartSelectors.length > 0) {
    if (y + 100 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(pdfFont.family, pdfFont.style);
    doc.text(normalizePdfText(copy.dashboardCharts), margin, y);
    y += 8;

    for (const selector of chartSelectors) {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        console.warn(`Chart selector not found: ${selector}`);
        continue;
      }

      try {
        // Check if we need a new page
        if (y + 100 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Capture the chart at high resolution with canvas-clone fix
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            try {
              // Ensure cloned canvases are visible and copy pixel data from originals
              const origCanvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
              const clonedCanvases = Array.from(clonedDoc.querySelectorAll('canvas')) as HTMLCanvasElement[];

              clonedCanvases.forEach((clonedCanvas, idx) => {
                const orig = origCanvases[idx];
                if (!orig) return;
                clonedCanvas.style.display = 'block';
                clonedCanvas.width = orig.width;
                clonedCanvas.height = orig.height;
                try {
                  const ctx = clonedCanvas.getContext('2d');
                  if (ctx) ctx.drawImage(orig, 0, 0);
                } catch (innerErr) {
                  console.warn('Failed to draw original canvas into cloned canvas for PDF export', innerErr);
                }
              });
            } catch (err) {
              console.warn('onclone canvas handling failed', err);
            }
          },
        });
        const imgData = canvas.toDataURL('image/png');

        // Calculate dimensions to fit the page
        const maxWidth = contentWidth;
        const imgProps = doc.getImageProperties(imgData);
        const imgHeight = (imgProps.height * maxWidth) / imgProps.width;

        // Center the image horizontally
        const xOffset = (pageWidth - maxWidth) / 2;

        // Add image to PDF
        doc.addImage(imgData, 'PNG', xOffset, y, maxWidth, imgHeight);
        y += imgHeight + 10;
      } catch (error) {
        console.error('PDF Export Error: Failed to capture chart', selector, error);
      }
    }
  }

  // Section 4: Chat History (if available)
  if (chatHistory && chatHistory.length > 0) {
    if (y + 40 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(pdfFont.family, pdfFont.style);
    doc.text(normalizePdfText(copy.aiAnalysisHistory), margin, y);
    y += 6;

    // Build a condensed chat display
    const chatTableHead = [copy.speaker, copy.message].map(normalizePdfText);
    const chatTableBody = chatHistory.slice(0, 8).map((msg) => {
      const speaker = msg.role === 'user' ? copy.you : copy.auraAi;
      const content = normalizePdfText(String(msg.content));
      const truncated = content.length > 100 ? `${content.substring(0, 100)}...` : content;
      return [normalizePdfText(speaker), truncated];
    });

    autoTable(doc, {
      startY: y,
      head: [chatTableHead],
      body: chatTableBody,
      theme: 'striped',
      styles: {
        font: pdfFont.family,
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      bodyStyles: {
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as PdfDocument).lastAutoTable?.finalY ?? y + 20;
  }

  // ======== ADD FOOTERS TO ALL PAGES ========
  const pageCount = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    doc.setPage(pageNum);
    
    // Footer background (light gray)
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont(pdfFont.family, pdfFont.style);

    // Page number (center)
    doc.text(
      normalizePdfText(`${copy.page} ${pageNum} ${copy.of} ${pageCount}`),
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    // Website/Contact (left)
    doc.text(normalizePdfText(`${companyName} | ${websiteUrl}`), margin, pageHeight - 6);

    // Timestamp (right)
    const timestamp = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
    doc.text(
      normalizePdfText(`${copy.generated}: ${timestamp}`),
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Save the PDF
  const filename = `${companyName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

