import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { getDashboardLocaleCopy, type DashboardPdfLabels } from "@/lib/i18n/dashboardCopy";

const UNICODE_FONT_STACK = "\"DejaVu Sans\", Arial, Helvetica, sans-serif";

function getPdfLabels(locale?: string, labels?: Partial<DashboardPdfLabels>) {
  return { ...getDashboardLocaleCopy(locale).pdf, ...(labels || {}) };
}

async function inlineComputedStyles(original: HTMLElement) {
  // Deep clone the node
  const clone = original.cloneNode(true) as HTMLElement;

  // Helper to walk two node lists in parallel and inline computed styles
  const origNodes = Array.from(original.querySelectorAll("*"));
  const cloneNodes = Array.from(clone.querySelectorAll("*"));

  // Inline root computed style
  try {
    const rootStyle = window.getComputedStyle(original);
    (clone as HTMLElement).style.cssText = rootStyle.cssText;
  } catch (e) {
    // ignore
  }

  for (let i = 0; i < origNodes.length; i++) {
    const o = origNodes[i] as HTMLElement;
    const c = cloneNodes[i] as HTMLElement;
    if (!o || !c) continue;
    try {
      const s = window.getComputedStyle(o);
      // Assign the computed cssText which will resolve color() lab() into concrete rgb/rgba values
      c.style.cssText = s.cssText;
    } catch (e) {
      // Fallback: ignore individual node style inlining failures
    }
  }

  return clone;
}

// Helper to add professional header and footer to PDF
function addHeaderFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 12;
  const marginBottom = 12;

  // Header background (light gray)
  pdf.setFillColor(248, 250, 252); // Light slate background
  pdf.rect(0, 0, pageWidth, 25, "F");

  // Header border
  pdf.setDrawColor(100, 116, 139); // Slate-600
  pdf.setLineWidth(0.5);
  pdf.line(0, 25, pageWidth, 25);

  // Header text
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42); // Slate-900
  pdf.text("AuraSales Executive Intelligence Report", marginLeft, marginTop + 7);

  // Footer background (light gray)
  pdf.setFillColor(248, 250, 252); // Light slate background
  pdf.rect(0, pageHeight - 20, pageWidth, 20, "F");

  // Footer border
  pdf.setDrawColor(100, 116, 139); // Slate-600
  pdf.setLineWidth(0.5);
  pdf.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

  // Footer text
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(51, 65, 85); // Slate-700

  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  pdf.text(`${date} • ${time}`, marginLeft, pageHeight - marginBottom - 2);
  pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginRight - 25, pageHeight - marginBottom - 2);

  // Reset text color for content
  pdf.setTextColor(0, 0, 0);
}

function addLocalizedHeaderFooter(
  pdf: jsPDF,
  pageNum: number,
  totalPages: number,
  locale: string,
  labels: DashboardPdfLabels
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 12;
  const marginBottom = 12;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 0, pageWidth, 25, "F");
  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.5);
  pdf.line(0, 25, pageWidth, 25);

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${labels.executiveSalesAnalysis} - AuraSales`, marginLeft, marginTop + 7);

  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, pageHeight - 20, pageWidth, 20, "F");
  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.5);
  pdf.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(51, 65, 85);

  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date());

  pdf.text(`${date} • ${time}`, marginLeft, pageHeight - marginBottom - 2);
  pdf.text(`${labels.page} ${pageNum} ${labels.of} ${totalPages}`, pageWidth - marginRight - 25, pageHeight - marginBottom - 2);
  pdf.setTextColor(0, 0, 0);
}

export async function exportDashboardToPDF(
  revenueElement: HTMLElement,
  regionalElement: HTMLElement,
  fileName = "AuraSales_Report.pdf",
  options?: { locale?: string; labels?: Partial<DashboardPdfLabels> }
) {
  const locale = options?.locale || "en";
  const labels = getPdfLabels(locale, options?.labels);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-99999px";
  container.style.left = "-99999px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;
    const headerHeight = 30; // Space for header
    const footerHeight = 25; // Space for footer
    const contentStartY = 60; // Below header (25px header + margin)
    const maxContentHeight = pageHeight - contentStartY - footerHeight - 20; // Leave room for footer

    // ===== PAGE 1: REVENUE OVERVIEW =====
    const revenueCloned = await inlineComputedStyles(revenueElement);
    revenueCloned.style.boxSizing = "border-box";
    revenueCloned.style.width = `${contentWidth}px`;
    // Professional white background to replace any glassmorphism/transparency
    revenueCloned.style.backgroundColor = "#ffffff"; // Clean professional white
    revenueCloned.style.padding = "24px";
    revenueCloned.style.borderRadius = "8px";
    // Remove any backdrop blur or transparency effects
    revenueCloned.style.backdropFilter = "none";
    revenueCloned.style.borderColor = "#e2e8f0"; // Slate-200
    revenueCloned.style.border = "1px solid #e2e8f0";
    revenueCloned.style.fontFamily = UNICODE_FONT_STACK;
    container.appendChild(revenueCloned);

    let revenueCanvas = await html2canvas(revenueCloned, { 
      scale: 1.5, 
      useCORS: true, 
      logging: false,
      backgroundColor: "#ffffff"
    });
    let revenueImgData = revenueCanvas.toDataURL("image/png");
    const revenueProps = (pdf as any).getImageProperties(revenueImgData);
    const revenueHeight = (contentWidth * revenueProps.height) / revenueProps.width;

    // Add header and footer first
    addLocalizedHeaderFooter(pdf, 1, 2, locale, labels);

    // Add section title with professional styling
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42); // Slate-900
    pdf.text(labels.revenueOverviewTitle, margin, contentStartY - 15);

    // Add subtitle with description
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139); // Slate-600
    pdf.text(labels.revenueOverviewSubtitle, margin, contentStartY - 5);

    // Scale image to fit page with padding
    const scaledRevenueHeight = Math.min(revenueHeight, maxContentHeight);
    const scaleFactor = scaledRevenueHeight / revenueHeight;
    pdf.addImage(
      revenueImgData,
      "PNG",
      margin,
      contentStartY,
      contentWidth,
      scaledRevenueHeight
    );

    container.removeChild(revenueCloned);

    // ===== PAGE 2: REGIONAL INSIGHTS =====
    pdf.addPage();
    
    const regionalCloned = await inlineComputedStyles(regionalElement);
    regionalCloned.style.boxSizing = "border-box";
    regionalCloned.style.width = `${contentWidth}px`;
    // Professional white background to replace any glassmorphism/transparency
    regionalCloned.style.backgroundColor = "#ffffff"; // Clean professional white
    regionalCloned.style.padding = "24px";
    regionalCloned.style.borderRadius = "8px";
    // Remove any backdrop blur or transparency effects
    regionalCloned.style.backdropFilter = "none";
    regionalCloned.style.borderColor = "#e2e8f0"; // Slate-200
    regionalCloned.style.border = "1px solid #e2e8f0";
    regionalCloned.style.fontFamily = UNICODE_FONT_STACK;
    container.appendChild(regionalCloned);

    let regionalCanvas = await html2canvas(regionalCloned, { 
      scale: 1.5, 
      useCORS: true, 
      logging: false,
      backgroundColor: "#ffffff"
    });
    let regionalImgData = regionalCanvas.toDataURL("image/png");
    const regionalProps = (pdf as any).getImageProperties(regionalImgData);
    const regionalHeight = (contentWidth * regionalProps.height) / regionalProps.width;

    // Add header and footer
    addLocalizedHeaderFooter(pdf, 2, 2, locale, labels);

    // Add section title with professional styling
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42); // Slate-900
    pdf.text(labels.regionalInsightsTitle, margin, contentStartY - 15);

    // Add subtitle with description
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139); // Slate-600
    pdf.text(labels.regionalInsightsSubtitle, margin, contentStartY - 5);

    // Scale image to fit page with padding
    const scaledRegionalHeight = Math.min(regionalHeight, maxContentHeight);
    pdf.addImage(
      regionalImgData,
      "PNG",
      margin,
      contentStartY,
      contentWidth,
      scaledRegionalHeight
    );

    container.removeChild(regionalCloned);

    pdf.save(fileName);
  } finally {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

// Legacy single-page export for backwards compatibility
export async function exportElementToPDF(element: HTMLElement, fileName = "AuraSales_Brief.pdf", opts?: { scale?: number }) {
  const scale = opts?.scale ?? 1.2;
  const original = element;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-99999px";
  container.style.left = "-99999px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  try {
    const cloned = await inlineComputedStyles(original);
    cloned.style.boxSizing = "border-box";
    cloned.style.width = `${original.getBoundingClientRect().width}px`;
    // Professional white background to replace any glassmorphism/transparency
    cloned.style.backgroundColor = "#ffffff";
    cloned.style.backdropFilter = "none";
    cloned.style.padding = "24px";
    cloned.style.borderRadius = "8px";
    cloned.style.borderColor = "#e2e8f0";
    cloned.style.border = "1px solid #e2e8f0";
    cloned.style.fontFamily = UNICODE_FONT_STACK;
    container.appendChild(cloned);

    const canvas = await html2canvas(cloned as HTMLElement, { 
      scale, 
      useCORS: true, 
      logging: false,
      backgroundColor: "#ffffff"
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = (pdf as any).getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    // Add header and footer
    addHeaderFooter(pdf, 1, 1);

    // Add title section
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("AuraSales Executive Brief", 40, 50);

    // Add content
    const contentStartY = 65;
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;
    const maxHeight = pageHeight - contentStartY - 30; // Leave room for footer
    const scaledHeight = Math.min(pdfHeight, maxHeight);
    
    pdf.addImage(imgData, "PNG", margin, contentStartY, contentWidth, scaledHeight);
    pdf.save(fileName);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

export default exportElementToPDF;
