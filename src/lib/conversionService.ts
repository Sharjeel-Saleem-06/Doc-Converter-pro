import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import MarkdownIt from 'markdown-it';
import Papa from 'papaparse';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';
import { saveAs } from 'file-saver';
import Turndown from 'turndown';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, BorderStyle, TextRun, AlignmentType, ImageRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Rich content interfaces for PDF parsing
interface PDFTableCell {
  text: string;
  rowSpan?: number;
  colSpan?: number;
}

interface PDFTable {
  type: 'table';
  rows: PDFTableCell[][];
  pageNumber: number;
}

interface PDFImage {
  type: 'image';
  data: Uint8Array;
  width: number;
  height: number;
  pageNumber: number;
}

interface PDFParagraph {
  type: 'paragraph';
  text: string;
  fontSize: number;
  pageNumber: number;
}

type PDFContentElement = PDFParagraph | PDFTable | PDFImage;

interface RichPDFContent {
  elements: PDFContentElement[];
  plainText: string; // Fallback for non-DOCX conversions
  images: PDFImage[]; // Separate array for extracted images
}

export type SupportedFormat =
  'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'xlsx' | 'xls' | 'rtf' |
  'epub' | 'csv' | 'json' | 'xml' | 'latex' | 'odt' | 'odp' |
  'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'webp';

export interface ConversionOptions {
  fontSize?: number;
  fontFamily?: string;
  pageSize?: 'A4' | 'A3' | 'Letter';
  margin?: number;
  watermark?: string;
  password?: string;
  quality?: 'low' | 'medium' | 'high';
  imageResolution?: number;
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  compression?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface ConversionResult {
  success: boolean;
  data?: Blob;
  error?: string;
  metadata?: {
    originalSize: number;
    convertedSize: number;
    processingTime: number;
    format: SupportedFormat;
    isZip?: boolean; // Indicates if the result is a ZIP file containing DOCX + images
    imageCount?: number; // Number of images included in ZIP
  };
}

export class ConversionService {
  private md: MarkdownIt;
  private turndown: Turndown;
  private richPDFContent: RichPDFContent | null = null; // Store rich PDF content for DOCX conversion

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    });

    this.turndown = new Turndown({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
  }

  // Enhanced format detection with content analysis
  detectFormat(filename: string, content?: string): SupportedFormat {
    const extension = filename.toLowerCase().split('.').pop();

    // Content-based detection for ambiguous cases
    if (content) {
      if (content.startsWith('<!DOCTYPE html') || content.includes('<html')) return 'html';
      if (content.startsWith('%PDF-')) return 'pdf';
      if (content.startsWith('PK')) {
        // ZIP-based formats - need to check filename extension
        if (extension === 'docx') return 'docx';
        if (extension === 'pptx') return 'pptx';
        if (extension === 'xlsx') return 'xlsx';
        if (extension === 'odt') return 'odt';
        if (extension === 'odp') return 'odp';
        if (extension === 'epub') return 'epub';
        return 'docx'; // Default for ZIP-based
      }
      if (content.includes('\\documentclass') || content.includes('\\begin{document}')) return 'latex';

      // JSON detection
      try {
        JSON.parse(content);
        return 'json';
      } catch { }

      // CSV detection
      if (content.includes(',') && content.split('\n').length > 1) {
        const lines = content.split('\n');
        if (lines[0].split(',').length > 1) return 'csv';
      }

      // Markdown detection (stricter)
      // Must look like MD structure and NOT like a log file (timestamps, [INFO], etc.)
      const mdStructure = /(^|\n)(#{1,6}\s)/; // Headings are strong indicators
      const mdList = /(^|\n)([\*\-]\s|\d+\.\s)/; // Lists are weaker

      const isLogLine = /(^|\n)(\[|\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2})/;

      if (mdStructure.test(content)) {
        return 'md';
      }
      if (mdList.test(content) && !isLogLine.test(content)) {
        return 'md';
      }
    }

    const formatMap: Record<string, SupportedFormat> = {
      'txt': 'txt', 'text': 'txt',
      'md': 'md', 'markdown': 'md', 'mdown': 'md',
      'html': 'html', 'htm': 'html',
      'pdf': 'pdf',
      'docx': 'docx', 'doc': 'doc',
      'pptx': 'pptx', 'ppt': 'ppt',
      'xlsx': 'xlsx', 'xls': 'xls',
      'rtf': 'rtf',
      'epub': 'epub',
      'csv': 'csv',
      'json': 'json',
      'xml': 'xml',
      'tex': 'latex', 'latex': 'latex',
      'png': 'png',
      'jpg': 'jpg', 'jpeg': 'jpg',
      'gif': 'gif',
      'bmp': 'bmp',
      'webp': 'webp',
      'odt': 'odt',
      'odp': 'odp'
    };

    return formatMap[extension || ''] || 'txt';
  }

  // Main conversion function with enhanced error handling
  async convertFile(
    content: string | ArrayBuffer,
    fromFormat: SupportedFormat,
    toFormat: SupportedFormat,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const originalSize = typeof content === 'string' ? content.length : content.byteLength;

    try {
      console.log(`Converting from ${fromFormat} to ${toFormat}`);

      // Validate conversion path
      if (!this._isConversionSupported(fromFormat, toFormat)) {
        throw new Error(`Conversion from ${fromFormat} to ${toFormat} is not supported`);
      }

      // Special handling for PDF conversion (preserve tables for all document/data formats)
      if (fromFormat === 'pdf' && typeof content !== 'string' && 
          !['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(toFormat)) {
        console.log(`Using enhanced PDF table extraction for ${toFormat.toUpperCase()} conversion`);
        this.richPDFContent = await this.parseRichPDFContent(content);
        // richPDFContent will be used in conversion methods and cleaned up there
      }
      
      // Special handling for PDF to Image conversion (PNG/JPG) - Create ZIP with one image per page
      if (fromFormat === 'pdf' && ['png', 'jpg', 'jpeg'].includes(toFormat) && typeof content !== 'string') {
        console.log('Converting PDF to images - creating ZIP with one image per page');
        
        try {
          const pdfData = new Uint8Array(content);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          const zip = new JSZip();
          
          // Convert each page to an image
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // High quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              // Convert to blob
              const imageFormat = toFormat === 'png' ? 'image/png' : 'image/jpeg';
              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), imageFormat, 0.95);
              });
              
              const imageData = await blob.arrayBuffer();
              const filename = `page_${pageNum}.${toFormat === 'jpg' ? 'jpg' : toFormat}`;
              zip.file(filename, imageData);
              
              console.log(`Converted page ${pageNum}/${pdf.numPages} to ${toFormat.toUpperCase()}`);
            }
          }
          
          // Generate ZIP
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const processingTime = Date.now() - startTime;
          
          return {
            success: true,
            data: zipBlob,
            metadata: {
              originalSize,
              convertedSize: zipBlob.size,
              processingTime,
              format: toFormat,
              isZip: true,
              imageCount: pdf.numPages
            }
          };
        } catch (error) {
          console.error('PDF to image conversion error:', error);
          throw new Error(`Failed to convert PDF to ${toFormat.toUpperCase()}: ${error}`);
        }
      }

      // Special handling for Image to PDF conversion
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fromFormat) && toFormat === 'pdf' && typeof content !== 'string') {
        console.log(`Converting ${fromFormat.toUpperCase()} image to PDF`);
        return await this.convertImageToPDF(content, fromFormat, options, originalSize, startTime);
      }

      // Normalize content to string
      let textContent = await this.normalizeContent(content, fromFormat);

      let result: Blob;

      switch (toFormat) {
        case 'pdf':
          result = await this.convertToPDF(textContent, fromFormat, options);
          break;
        case 'html':
          result = await this.convertToHTML(textContent, fromFormat, options);
          break;
        case 'md':
          result = await this.convertToMarkdown(textContent, fromFormat, options);
          break;
        case 'txt':
          result = await this.convertToText(textContent, fromFormat, options);
          break;
        case 'docx':
          result = await this.convertToDocx(textContent, fromFormat, options);
          break;
        case 'doc':
          result = await this.convertToDoc(textContent, fromFormat, options);
          break;
        case 'pptx':
          result = await this.convertToPPTX(textContent, fromFormat, options);
          break;
        case 'ppt':
          result = await this.convertToPPT(textContent, fromFormat, options);
          break;
        case 'xlsx':
          result = await this.convertToXLSX(textContent, fromFormat, options);
          break;
        case 'xls':
          result = await this.convertToXLS(textContent, fromFormat, options);
          break;
        case 'csv':
          result = await this.convertToCSV(textContent, fromFormat, options);
          break;
        case 'json':
          result = await this.convertToJSON(textContent, fromFormat, options);
          break;
        case 'xml':
          result = await this.convertToXML(textContent, fromFormat, options);
          break;
        case 'rtf':
          result = await this.convertToRTF(textContent, fromFormat, options);
          break;
        case 'epub':
          result = await this.convertToEPUB(textContent, fromFormat, options);
          break;
        case 'latex':
          result = await this.convertToLaTeX(textContent, fromFormat, options);
          break;
        case 'odt':
          result = await this.convertToODT(textContent, fromFormat, options);
          break;
        case 'odp':
          result = await this.convertToODP(textContent, fromFormat, options);
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'webp':
          if (fromFormat === 'pdf') {
            // Pass raw content (ArrayBuffer) for PDF to allow canvas rendering
            result = await this.convertToImage(content, fromFormat, toFormat, options);
          } else {
            result = await this.convertToImage(textContent, fromFormat, toFormat, options);
          }
          break;
        default:
          throw new Error(`Conversion to ${toFormat} not implemented`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          originalSize,
          convertedSize: result.size,
          processingTime,
          format: toFormat
        }
      };

    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  private _isConversionSupported(from: SupportedFormat, to: SupportedFormat): boolean {
    // Define supported conversion paths
    const supportedPaths: Record<SupportedFormat, SupportedFormat[]> = {
      txt: ['pdf', 'html', 'md', 'docx', 'rtf', 'json', 'xml', 'latex', 'epub', 'odt', 'png', 'jpg'],
      md: ['pdf', 'html', 'txt', 'docx', 'rtf', 'latex', 'epub', 'odt', 'png', 'jpg'],
      html: ['pdf', 'md', 'txt', 'docx', 'rtf', 'png', 'jpg'],
      pdf: ['txt', 'html', 'md', 'docx', 'json', 'xml', 'csv', 'png', 'jpg', 'rtf', 'odt', 'epub', 'latex'], // Full PDF conversion support
      docx: ['txt', 'html', 'md', 'pdf', 'rtf', 'odt'],
      doc: ['txt', 'html', 'md', 'pdf', 'rtf', 'docx', 'odt'],
      pptx: ['pdf', 'txt', 'html', 'md', 'ppt'],
      ppt: ['pdf', 'txt', 'html', 'md', 'pptx'],
      xlsx: ['csv', 'json', 'html', 'txt', 'pdf', 'xls'],
      xls: ['csv', 'json', 'html', 'txt', 'pdf', 'xlsx'],
      csv: ['json', 'xml', 'html', 'txt', 'pdf', 'xlsx', 'docx', 'doc', 'pptx', 'ppt', 'rtf', 'odt', 'epub', 'latex', 'md', 'png', 'jpg'],
      json: ['csv', 'xml', 'txt', 'html', 'pdf'],
      xml: ['json', 'html', 'txt', 'pdf'],
      rtf: ['txt', 'html', 'md', 'pdf', 'docx'],
      epub: ['txt', 'html', 'md', 'pdf'],
      latex: ['pdf', 'html', 'txt', 'md'],
      odt: ['txt', 'html', 'md', 'pdf', 'docx'],
      odp: ['txt', 'html', 'md', 'pdf', 'pptx'],
      png: ['pdf', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'],
      jpg: ['pdf', 'png', 'gif', 'bmp', 'webp'],
      jpeg: ['pdf', 'png', 'jpg', 'gif', 'bmp', 'webp'],
      gif: ['pdf', 'png', 'jpg', 'jpeg', 'bmp', 'webp'],
      bmp: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'],
      webp: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp']
    };

    return from !== to && (supportedPaths[from]?.includes(to) || false);
  }

  // Public method to check if conversion is supported
  isConversionSupported(from: SupportedFormat, to: SupportedFormat): boolean {
    return this._isConversionSupported(from, to);
  }

  private async normalizeContent(content: string | ArrayBuffer, format: SupportedFormat): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }

    // Handle binary content based on format
    switch (format) {
      case 'docx':
        try {
          // Prefer HTML with inline images to retain structure for downstream rendering
          const result = await mammoth.convertToHtml(
            { arrayBuffer: content }
          );
          return result.value || '';
        } catch (error) {
          console.warn('Failed to extract DOCX content, using raw text');
          return new TextDecoder().decode(content);
        }

      case 'doc':
        try {
          // For older DOC files, we'll try to extract what we can
          const text = new TextDecoder().decode(content);
          // Basic extraction - remove binary data and keep readable text
          return text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        } catch (error) {
          console.warn('Failed to extract DOC content');
          return '[DOC content - extraction requires additional processing]';
        }

      case 'pptx':
      case 'ppt':
        try {
          // For PowerPoint files, we'll extract text from the ZIP structure
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(content);
          let extractedText = '';

          // Look for slide content in PPTX structure
          const slideFiles = Object.keys(zipContent.files).filter(name =>
            name.includes('slide') && name.endsWith('.xml')
          );

          for (const slideFile of slideFiles) {
            try {
              const slideContent = await zipContent.files[slideFile].async('text');
              // Extract text from XML (basic extraction)
              const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
              if (textMatches) {
                textMatches.forEach(match => {
                  const text = match.replace(/<[^>]*>/g, '');
                  if (text.trim()) {
                    extractedText += text + '\n';
                  }
                });
              }
            } catch (e) {
              console.warn(`Failed to extract from ${slideFile}`);
            }
          }

          return extractedText || '[PowerPoint content - slides detected but text extraction limited]';
        } catch (error) {
          console.warn('Failed to extract PowerPoint content');
          return '[PowerPoint content - extraction requires additional processing]';
        }

      case 'xlsx':
      case 'xls':
        try {
          // Use XLSX library for better Excel parsing
          const workbook = XLSX.read(content, { type: 'array' });
          let extractedData = '';

          // Process all worksheets
          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            if (worksheet) {
              extractedData += `Sheet: ${sheetName}\n`;

              // Convert to CSV format for easier processing
              const csvData = XLSX.utils.sheet_to_csv(worksheet);
              extractedData += csvData + '\n\n';
            }
          });

          return extractedData || '[Excel content - no data found in worksheets]';
        } catch (error) {
          console.warn('Failed to extract Excel content with XLSX library, trying basic extraction');
          // Fallback to basic extraction
          if (format === 'xlsx') {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(content);

            // Look for worksheet data
            const worksheetFiles = Object.keys(zipContent.files).filter(name =>
              name.includes('worksheet') && name.endsWith('.xml')
            );

            let extractedData = '';
            for (const worksheetFile of worksheetFiles) {
              try {
                const worksheetContent = await zipContent.files[worksheetFile].async('text');
                // Basic extraction of cell values
                const cellMatches = worksheetContent.match(/<v>([^<]*)<\/v>/g);
                if (cellMatches) {
                  const values = cellMatches.map(match => match.replace(/<[^>]*>/g, ''));
                  extractedData += values.join(',') + '\n';
                }
              } catch (e) {
                console.warn(`Failed to extract from ${worksheetFile}`);
              }
            }

            return extractedData || '[Excel content - spreadsheet detected but data extraction limited]';
          } else {
            // For older XLS files
            return '[Excel content - XLS format requires specialized parsing]';
          }
        }

      case 'pdf':
        // Extract text from PDF using pdfjs-dist
        try {
          const pdfData = new Uint8Array(content);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Group text items by vertical position (lines) with font size detection
            const lines: Map<number, { text: string[], maxFontSize: number }> = new Map();

            textContent.items.forEach((item: any) => {
              if (item.str && item.str.trim()) {
                // Round Y position to group items on same line
                const yPos = Math.round(item.transform[5]);
                // Detect font size (scaleY)
                const fontSize = Math.abs(item.transform[3]);

                if (!lines.has(yPos)) {
                  lines.set(yPos, { text: [], maxFontSize: 0 });
                }
                const line = lines.get(yPos)!;
                line.text.push(item.str);
                line.maxFontSize = Math.max(line.maxFontSize, fontSize);
              }
            });

            // Sort lines by Y position (top to bottom, but PDF coords are bottom-up usually, wait...)
            // PDF coords: (0,0) is bottom-left. So larger Y is higher up.
            // standard sort b - a gives descending (larger Y first), which is correct for PDF.
            const sortedYPositions = Array.from(lines.keys()).sort((a, b) => b - a);

            // Build page text
            let pageText = '';
            let lastY: number | null = null;

            sortedYPositions.forEach(yPos => {
              const lineData = lines.get(yPos)!;
              let lineText = lineData.text.join(' ');

              // Apply Markdown headings based on font size
              // Assuming standard text is ~10-12pt
              if (lineData.maxFontSize >= 24) {
                lineText = '# ' + lineText;
              } else if (lineData.maxFontSize >= 16) {
                lineText = '## ' + lineText;
              } else if (lineData.maxFontSize >= 14) {
                lineText = '### ' + lineText;
              }

              // Detect paragraph breaks (large Y gap)
              if (lastY !== null && Math.abs(lastY - yPos) > 16) { // Reduced gap threshold for better paragraph detection
                pageText += '\n\n';
              } else if (lastY !== null) {
                pageText += '\n';
              }

              pageText += lineText;
              lastY = yPos;
            });

            fullText += pageText;

            // Add page separator for multi-page documents
            if (pageNum < pdf.numPages) {
              fullText += '\n\n--- Page ' + (pageNum + 1) + ' ---\n\n';
            }
          }

          return fullText.trim() || '[PDF contains no extractable text - may be scanned/image-based]';
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);
          return '[PDF content extraction failed - file may be corrupted or encrypted]';
        }

      default:
        return new TextDecoder().decode(content);
    }
  }

  // Enhanced PDF parser that extracts text, tables, and images
  private async parseRichPDFContent(content: ArrayBuffer): Promise<RichPDFContent> {
    const elements: PDFContentElement[] = [];
    const extractedImages: PDFImage[] = [];
    let plainText = '';

    try {
      // Use pdfjs-dist for text and structure extraction
      const pdfData = new Uint8Array(content);
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const operatorList = await page.getOperatorList();

        // Detect images by checking for image operations
        let imageCount = 0;
        try {
          for (let i = 0; i < operatorList.fnArray.length; i++) {
            const op = operatorList.fnArray[i];
            // Common image operation codes: 49 = paintImageXObject, 44 = paintInlineImageXObject
            if (op === 49 || op === 44) {
              imageCount++;
            }
          }
          
          // Note: Full PDF image extraction is complex and requires embedded image parsing
          // For now, we just note if images exist but don't extract them
          if (imageCount > 0 && imageCount < 20) {
            console.log(`Page ${pageNum}: Detected ${imageCount} image operation(s) - image extraction not implemented`);
            // Don't add image elements since we're not extracting them properly
          }
        } catch (imgError) {
          console.warn('Error detecting images:', imgError);
        }

        // Detect tables by analyzing text positions
        const textItems: Array<{ text: string; x: number; y: number; fontSize: number }> = [];
        
        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            textItems.push({
              text: item.str,
              x: Math.round(item.transform[4]),
              y: Math.round(item.transform[5]),
              fontSize: Math.abs(item.transform[3])
            });
          }
        });

        // Sort items by Y position (top to bottom)
        textItems.sort((a, b) => b.y - a.y);

        // Group items by rows (similar Y positions)
        const rows: Array<Array<{ text: string; x: number; fontSize: number }>> = [];
        let currentRow: Array<{ text: string; x: number; fontSize: number }> = [];
        let lastY: number | null = null;

        textItems.forEach(item => {
          if (lastY !== null && Math.abs(lastY - item.y) > 5) {
            // New row detected
            if (currentRow.length > 0) {
              rows.push([...currentRow]);
              currentRow = [];
            }
          }
          currentRow.push({ text: item.text, x: item.x, fontSize: item.fontSize });
          lastY = item.y;
        });
        
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }

        // Improved table detection with better heuristics
        let tableStartIdx = -1;
        let tableRows: PDFTableCell[][] = [];
        
        console.log(`Page ${pageNum}: Analyzing ${rows.length} rows for table detection`);
        
        // Enhanced table detection: look for rows with numeric/short text patterns
        let columnPositions: number[] = [];
        const potentialTableRows: number[] = [];
        
        // First, identify rows that look like table data (numbers, short text, consistent spacing)
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 2) {
            // Check if row contains mostly numbers or very short text (likely table cells)
            const numericCells = row.filter(cell => 
              /^\d+$/.test(cell.text.trim()) || cell.text.trim().length <= 3
            ).length;
            
            const hasConsistentSpacing = row.length >= 3;
            const avgTextLength = row.reduce((sum, cell) => sum + cell.text.trim().length, 0) / row.length;
            
            // Table rows typically have: multiple columns, short text, or numbers
            if ((numericCells >= row.length * 0.5 || avgTextLength < 8) && hasConsistentSpacing) {
              potentialTableRows.push(i);
              
              // Track column positions from potential table rows only
              row.forEach(cell => {
                const existing = columnPositions.find(pos => Math.abs(pos - cell.x) < 40);
                if (!existing) {
                  columnPositions.push(cell.x);
                }
              });
            }
          }
        }
        
        // Merge nearby column positions (within 50px) to avoid splitting cells
        if (columnPositions.length > 0) {
          columnPositions.sort((a, b) => a - b);
          const mergedColumns: number[] = [columnPositions[0]];
          
          for (let i = 1; i < columnPositions.length; i++) {
            const lastCol = mergedColumns[mergedColumns.length - 1];
            if (columnPositions[i] - lastCol > 50) {
              mergedColumns.push(columnPositions[i]);
            } else {
              // Merge close columns by taking the average
              mergedColumns[mergedColumns.length - 1] = (lastCol + columnPositions[i]) / 2;
            }
          }
          
          columnPositions = mergedColumns;
        }
        
        const hasTableStructure = columnPositions.length >= 2 && potentialTableRows.length >= 2;
        console.log(`Page ${pageNum}: Found ${columnPositions.length} merged column positions from ${potentialTableRows.length} potential table rows`);
        
        if (hasTableStructure) {
          columnPositions.sort((a, b) => a - b);
        }
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          
          // Sort by X position to get columns
          row.sort((a, b) => a.x - b.x);
          
          // Determine if this is a table row
          let isTableRow = false;
          let mappedCells: string[] = [];
          
          if (row.length >= 2 && hasTableStructure && potentialTableRows.includes(i)) {
            // Map cells to column positions with larger tolerance
            mappedCells = columnPositions.map(colX => {
              const cell = row.find(c => Math.abs(c.x - colX) < 60);
              return cell ? cell.text : '';
            });
            
            // Check if at least 50% of columns have data
            const filledCells = mappedCells.filter(c => c.trim()).length;
            
            // Additional validation: check if row has table-like characteristics
            const numericCells = mappedCells.filter(c => /^\d+$/.test(c.trim())).length;
            const shortCells = mappedCells.filter(c => c.trim().length <= 3).length;
            
            isTableRow = filledCells >= Math.max(2, columnPositions.length * 0.3) &&
                         (numericCells >= 2 || shortCells >= filledCells * 0.5);
          }
          
          if (isTableRow) {
            // This is a table row
            if (tableStartIdx < 0) {
              tableStartIdx = i;
              console.log(`Page ${pageNum}: Table detected starting at row ${i}`);
            }
            
            // Add row to table with proper column alignment
            const tableCells: PDFTableCell[] = mappedCells.map(text => ({ text: text.trim() }));
            tableRows.push(tableCells);
          } else {
            // Not a table row
            // First, save any pending table
            if (tableStartIdx >= 0 && tableRows.length >= 2) {
              console.log(`Page ${pageNum}: Table ended, saving ${tableRows.length} rows × ${tableRows[0].length} columns`);
              console.log(`Table data sample:`, tableRows.slice(0, 3).map(r => r.map(c => c.text).join(' | ')));
              
              elements.push({
                type: 'table',
                rows: tableRows,
                pageNumber: pageNum
              });
              
              plainText += '\n[TABLE]\n';
              tableRows.forEach(trow => {
                plainText += trow.map(cell => cell.text).join('\t') + '\n';
              });
              plainText += '[/TABLE]\n\n';
              
              tableStartIdx = -1;
              tableRows = [];
            }
            
            // Add current row as paragraph
            const rowText = row.map(cell => cell.text).join(' ');
            const maxFontSize = Math.max(...row.map(cell => cell.fontSize));
            
            elements.push({
              type: 'paragraph',
              text: rowText,
              fontSize: maxFontSize,
              pageNumber: pageNum
            });
            
            plainText += rowText + '\n';
          }
        }
        
        // Handle remaining table if page ends
        if (tableStartIdx >= 0 && tableRows.length >= 2) {
          elements.push({
            type: 'table',
            rows: tableRows,
            pageNumber: pageNum
          });
          
          plainText += '\n[TABLE]\n';
          tableRows.forEach(row => {
            plainText += row.map(cell => cell.text).join('\t') + '\n';
          });
          plainText += '[/TABLE]\n\n';
        }

        // Add page separator
        if (pageNum < pdf.numPages) {
          plainText += '\n--- Page ' + (pageNum + 1) + ' ---\n\n';
        }
      }

      return {
        elements,
        plainText: plainText.trim(),
        images: extractedImages
      };
    } catch (error) {
      console.error('Rich PDF parsing error:', error);
      // Fallback to plain text extraction
      return {
        elements: [],
        plainText: '[PDF content extraction failed]',
        images: []
      };
    }
  }

  // Enhanced PDF conversion with better formatting
  /**
   * Convert image (PNG, JPG, JPEG, GIF, BMP, WEBP) to PDF
   * Creates a PDF with the image fitted to the page
   */
  private async convertImageToPDF(
    content: ArrayBuffer,
    fromFormat: SupportedFormat,
    options: ConversionOptions,
    originalSize: number,
    startTime: number
  ): Promise<ConversionResult> {
    try {
      const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: options.pageSize || 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = options.margin || 10;

      // Create an image element to get dimensions
      const blob = new Blob([content], { type: `image/${fromFormat === 'jpg' ? 'jpeg' : fromFormat}` });
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Calculate dimensions to fit image on page while maintaining aspect ratio
      const imgWidth = img.width;
      const imgHeight = img.height;
      const imgAspectRatio = imgWidth / imgHeight;
      
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      const pageAspectRatio = availableWidth / availableHeight;

      let finalWidth, finalHeight;
      
      if (imgAspectRatio > pageAspectRatio) {
        // Image is wider than page - fit to width
        finalWidth = availableWidth;
        finalHeight = availableWidth / imgAspectRatio;
      } else {
        // Image is taller than page - fit to height
        finalHeight = availableHeight;
        finalWidth = availableHeight * imgAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = (pageHeight - finalHeight) / 2;

      // Convert image data to base64 for jsPDF
      const base64Image = await this.arrayBufferToBase64(content, fromFormat);
      
      // Add image to PDF
      doc.addImage(base64Image, fromFormat.toUpperCase() === 'JPG' ? 'JPEG' : fromFormat.toUpperCase(), 
                   xOffset, yOffset, finalWidth, finalHeight);

      // Add metadata
      if (options.includeMetadata) {
        doc.setProperties({
          title: `Converted from ${fromFormat.toUpperCase()}`,
          creator: 'DocConverter Pro'
        });
      }

      // Add watermark if specified
      if (options.watermark) {
        doc.setFontSize(40);
        doc.setTextColor(200, 200, 200);
        doc.text(options.watermark, pageWidth / 2, pageHeight / 2, {
          angle: 45,
          align: 'center'
        });
      }

      const pdfBlob = doc.output('blob');
      URL.revokeObjectURL(imageUrl);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: pdfBlob,
        metadata: {
          originalSize,
          convertedSize: pdfBlob.size,
          processingTime,
          format: 'pdf'
        }
      };
    } catch (error) {
      console.error('Image to PDF conversion error:', error);
      throw new Error(`Failed to convert ${fromFormat.toUpperCase()} to PDF: ${error}`);
    }
  }

  private async convertToPDF(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Smart orientation detection
    const shouldUseLandscape = options.orientation === 'landscape' ||
      (!options.orientation && ['csv', 'xlsx', 'xls', 'json', 'xml'].includes(fromFormat));

    const doc = new jsPDF({
      orientation: shouldUseLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = options.margin || 20;
    const lineHeight = 7;
    const fontSize = options.fontSize || 12;

    doc.setFontSize(fontSize);
    doc.setFont(options.fontFamily || 'helvetica');

    // Process content based on source format
    let processedContent = await this.preprocessContentForPDF(content, fromFormat, options);

    // Handle metadata
    if (options.includeMetadata) {
      doc.setProperties({
        title: 'Converted Document',
        creator: 'DocConverter Pro'
      });
    }

    // Split content into pages (default text-based approach)
    const lines = doc.splitTextToSize(processedContent, pageWidth - 2 * margin);
    let y = margin + 10; // Start below header

    // Add header
    doc.setFontSize(16);
    doc.setFont(options.fontFamily || 'helvetica', 'bold');
    doc.text('Converted Document', margin, margin);
    doc.setFontSize(fontSize);
    doc.setFont(options.fontFamily || 'helvetica', 'normal');

    // If we have HTML-rich content (docx/html/md/odt), render via HTML snapshot to preserve tables/images
    if (['html', 'docx', 'doc', 'odt', 'md'].includes(fromFormat)) {
      try {
        const htmlContent = this.prepareHTMLForRendering(processedContent, fromFormat, options);
        await this.renderHTMLToPDF(doc, htmlContent, {
          margin,
          pageWidth,
          pageHeight,
          fontFamily: options.fontFamily || 'helvetica'
        });
      } catch (e) {
        console.warn('Falling back to text PDF path for rich content:', e);
        y = this.renderPlainLinesToPDF(doc, lines, y, lineHeight, margin, pageHeight);
      }
    }
    // CSV → table path
    else if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true });
        if (parsed.data && parsed.data.length > 0) {
          const headers = Object.keys(parsed.data[0] as any).map(h => ({ title: h, dataKey: h }));
          const data = parsed.data;

          // Dynamic font size based on column count to fit wide tables
          const colCount = headers.length;
          let safeFontSize = 10;
          if (colCount > 15) safeFontSize = 5;
          else if (colCount > 10) safeFontSize = 6;
          else if (colCount > 5) safeFontSize = 8;

          autoTable(doc, {
            head: [headers.map(h => h.title)],
            body: data.map((row: any) => headers.map(h => row[h.dataKey])),
            startY: y,
            margin: { top: margin, right: margin, bottom: margin, left: margin },
            theme: 'grid',
            tableWidth: 'auto',
            styles: {
              font: options.fontFamily || 'helvetica',
              fontSize: safeFontSize,
              cellPadding: colCount > 10 ? 1 : 2,
              overflow: 'linebreak',
              valign: 'middle',
              halign: 'left'
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            columnStyles: {
              // Optional: Add specific column widths if needed
            }
          });
        }
      } catch (e) {
        console.warn('Failed to generate PDF table from CSV', e);
        // Fallback to text
        y = this.renderPlainLinesToPDF(doc, lines, y, lineHeight, margin, pageHeight);
      }
    }
    // Default text rendering
    else {
      y = this.renderPlainLinesToPDF(doc, lines, y, lineHeight, margin, pageHeight);
    }

    // Add watermark if specified
    if (options.watermark) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(60);
        doc.text(options.watermark, pageWidth / 2, pageHeight / 2, {
          angle: 45,
          align: 'center'
        });
        doc.setTextColor(0, 0, 0); // Reset color
      }
    }

    return doc.output('blob');
  }

  private async preprocessContentForPDF(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<string> {
    switch (fromFormat) {
      case 'md':
        // Keep rich HTML to preserve headings/lists/tables via HTML snapshot
        return this.md.render(content);

      case 'html':
        return content;

      case 'docx':
      case 'doc':
        // If normalizeContent already returned HTML, keep it
        return content;

      case 'odt':
        // Currently normalized to text; keep as-is
        return content;

      case 'json':
        try {
          const jsonData = JSON.parse(content);
          return JSON.stringify(jsonData, null, 2);
        } catch {
          return content;
        }

      case 'csv':
        // Return raw content for CSV as we'll handle it specially in convertToPDF
        return content;

      default:
        return content;
    }
  }

  // Render plain text lines onto PDF pages (shared fallback)
  private renderPlainLinesToPDF(
    doc: jsPDF,
    lines: string[],
    startY: number,
    lineHeight: number,
    margin: number,
    pageHeight: number
  ): number {
    let y = startY;
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    return y;
  }

  // Prepare HTML with consistent styling for PDF/image rendering
  private prepareHTMLForRendering(htmlContent: string, fromFormat: SupportedFormat, options: ConversionOptions): string {
    const fontFamily = options.fontFamily || 'Arial, sans-serif';
    return `
      <style>
        body { font-family: ${fontFamily}; font-size: ${options.fontSize || 14}px; line-height: 1.6; color: #222; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        img { max-width: 100%; height: auto; }
        h1, h2, h3, h4, h5, h6 { margin: 16px 0 8px; }
        ul, ol { margin: 8px 0 8px 20px; }
        pre, code { font-family: "Fira Code", "Courier New", monospace; background: #f8f8f8; padding: 6px; display: block; white-space: pre-wrap; }
      </style>
      <div data-source="${fromFormat}">
        ${htmlContent}
      </div>
    `;
  }

  // Render HTML content to PDF pages using html2canvas snapshots (preserves tables/images)
  private async renderHTMLToPDF(
    doc: jsPDF,
    htmlContent: string,
    opts: { margin: number; pageWidth: number; pageHeight: number; fontFamily: string }
  ) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${opts.pageWidth * 3}px`; // generous width for clarity
    container.style.padding = `${opts.margin}px`;
    container.style.background = '#fff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pxPerMm = 96 / 25.4; // approximate CSS px to mm
      const pageWidthPx = (opts.pageWidth - opts.margin * 2) * pxPerMm;
      const pageHeightPx = (opts.pageHeight - opts.margin * 2) * pxPerMm;

      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let page = 0; page < totalPages; page++) {
        const sourceY = page * pageHeightPx;
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(pageHeightPx, canvas.height - sourceY);
        const ctx = slice.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          const sliceData = slice.toDataURL('image/png');
          const imgProps = doc.getImageProperties(sliceData);
          const pdfWidth = opts.pageWidth - opts.margin * 2;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          if (page > 0) doc.addPage();
          doc.addImage(sliceData, 'PNG', opts.margin, opts.margin, pdfWidth, pdfHeight);
        }
      }
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }

  // Enhanced HTML conversion with better styling
  // Helper: Convert rich PDF content to HTML
  private richPDFToHTML(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return `<pre>${this.escapeHTML(this.richPDFContent?.plainText || '')}</pre>`;
    }

    let htmlContent = '';

    for (const element of this.richPDFContent.elements) {
      if (element.type === 'paragraph') {
        const escaped = this.escapeHTML(element.text);
        // Add headings based on font size
        if (element.fontSize >= 24) {
          htmlContent += `<h1>${escaped}</h1>\n`;
        } else if (element.fontSize >= 18) {
          htmlContent += `<h2>${escaped}</h2>\n`;
        } else if (element.fontSize >= 14) {
          htmlContent += `<h3>${escaped}</h3>\n`;
        } else {
          htmlContent += `<p>${escaped}</p>\n`;
        }
      } else if (element.type === 'table') {
        // Convert to HTML table
        if (element.rows.length > 0) {
          htmlContent += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">\n';
          
          // Header row
          htmlContent += '  <thead><tr>';
          element.rows[0].forEach(cell => {
            htmlContent += `<th>${this.escapeHTML(cell.text || '')}</th>`;
          });
          htmlContent += '</tr></thead>\n';
          
          // Body rows
          htmlContent += '  <tbody>\n';
          for (let i = 1; i < element.rows.length; i++) {
            htmlContent += '    <tr>';
            element.rows[i].forEach(cell => {
              htmlContent += `<td>${this.escapeHTML(cell.text || '')}</td>`;
            });
            htmlContent += '</tr>\n';
          }
          htmlContent += '  </tbody>\n</table>\n';
        }
      }
    }

    return htmlContent;
  }

  private async convertToHTML(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let htmlContent = '';
    let title = 'Converted Document';

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      htmlContent = this.richPDFToHTML();
      this.richPDFContent = null; // Clean up
      title = 'PDF Document';
    } else {
      switch (fromFormat) {
        case 'md':
          htmlContent = this.md.render(content);
          // Extract title from first heading
          const titleMatch = content.match(/^#\s+(.+)$/m);
          if (titleMatch) title = titleMatch[1];
          break;

        case 'pdf':
          // Fallback for non-rich PDF
          htmlContent = this.md.render(content);
          break;

      case 'txt':
        htmlContent = `<pre class="text-content">${this.escapeHTML(content)}</pre>`;
        break;

      case 'json':
        try {
          const jsonData = JSON.parse(content);
          htmlContent = `<pre class="json-content"><code>${JSON.stringify(jsonData, null, 2)}</code></pre>`;
          title = 'JSON Document';
        } catch {
          htmlContent = `<pre class="text-content">${this.escapeHTML(content)}</pre>`;
        }
        break;

      case 'csv':
        htmlContent = this.csvToHTMLTable(content);
        title = 'CSV Data';
        break;

      case 'xml':
        htmlContent = `<pre class="xml-content"><code>${this.escapeXML(content)}</code></pre>`;
        title = 'XML Document';
        break;

      default:
        htmlContent = content;
      }
    }

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: ${options.fontFamily || 'system-ui, -apple-system, sans-serif'};
            font-size: ${options.fontSize || 16}px;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
            background: #fff;
        }
        .text-content {
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        .json-content, .xml-content {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 1rem;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 1rem 0;
            padding-left: 1rem;
            color: #666;
        }
        @media print {
            body { margin: 0; padding: 1rem; }
        }
    </style>
</head>
<body>
    ${htmlContent}
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; font-size: 0.9em;">
        <p>Generated by DocConverter Pro on ${new Date().toLocaleDateString()}</p>
    </footer>
</body>
</html>`;

    return new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
  }

  public csvToHTMLTable(csvContent: string): string {
    try {
      const parsed = Papa.parse(csvContent, { header: true });
      if (parsed.errors.length > 0) throw new Error('CSV parsing failed');

      const headers = Object.keys(parsed.data[0] || {});
      let html = '<table><thead><tr>';

      headers.forEach(header => {
        html += `<th>${this.escapeHTML(header)}</th>`;
      });

      html += '</tr></thead><tbody>';

      parsed.data.forEach((row: any) => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${this.escapeHTML(row[header] || '')}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
      return html;
    } catch {
      // Fallback to simple table
      const lines = csvContent.split('\n').filter(line => line.trim());
      let html = '<table>';

      lines.forEach((line, index) => {
        const cells = line.split(',');
        const tag = index === 0 ? 'th' : 'td';
        html += '<tr>';
        cells.forEach(cell => {
          html += `<${tag}>${this.escapeHTML(cell.trim())}</${tag}>`;
        });
        html += '</tr>';
      });

      html += '</table>';
      return html;
    }
  }

  // Additional conversion methods for new formats
  private async convertToRTF(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      content = this.richPDFContent.plainText;
      this.richPDFContent = null;
    }

    // Basic RTF generation
    let rtfContent = '{\\rtf1\\ansi\\deff0\n';

    // Add font table
    rtfContent += '{\\fonttbl{\\f0 Arial;}}\n';
    rtfContent += '\\f0\\fs24\n'; // Arial 12pt

    // Add content
    let textContent = content;

    if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true });
        if (parsed.data && parsed.data.length > 0) {
          const headers = Object.keys(parsed.data[0] as any);
          const data = parsed.data as any[];

          // RTF Table Generation
          // Header Row
          rtfContent += '\\trowd\\trgaph108\\trleft-108\n'; // Start row definition
          headers.forEach((h, i) => {
            rtfContent += `\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx${(i + 1) * 2000}\n`;
          });

          headers.forEach(h => {
            rtfContent += `\\pard\\intbl {\\b ${this.escapeRTF(h)}}\\cell\n`;
          });
          rtfContent += '\\row\n'; // End header row

          // Data Rows
          data.forEach(row => {
            rtfContent += '\\trowd\\trgaph108\\trleft-108\n';
            headers.forEach((h, i) => {
              rtfContent += `\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx${(i + 1) * 2000}\n`;
            });

            headers.forEach(h => {
              rtfContent += `\\pard\\intbl ${this.escapeRTF(String(row[h] || ''))}\\cell\n`;
            });
            rtfContent += '\\row\n';
          });

          textContent = ''; // Handled above
        }
      } catch (e) {
        // Fallback to text
        textContent = content;
      }
    } else if (fromFormat === 'html') {
      const hasTable = /<table/i.test(content);
      const hasImg = /<img[^>]*src=/i.test(content);
      if (hasTable) {
        rtfContent += '\\pard\\sa200\\sl276\\slmult1 ' + this.escapeRTF('[Table omitted in RTF export]') + '\\par\n';
      }
      if (hasImg) {
        rtfContent += '\\pard\\sa200\\sl276\\slmult1 ' + this.escapeRTF('[Image omitted in RTF export]') + '\\par\n';
      }
      textContent = this.stripHTML(content);
    } else if (fromFormat === 'md' || fromFormat === 'pdf') {
      textContent = this.stripMarkdown(content);
    }

    if (textContent) {
      // Improved paragraph handling for PDF/Text
      // Split by double newline to detect paragraphs
      const paragraphs = textContent.split(/\n\s*\n/);

      paragraphs.forEach(para => {
        if (para.trim()) {
          // Reflow text: Join single newlines with space
          const cleanPara = para.replace(/\r/g, '').replace(/\n/g, ' ').trim();
          // Add paragraph (\\pard resets paragraph props, \\par ends it)
          // Add extra \\par for spacing if desired, or relying on \\pard spacing if defined
          // Here we just use standard paragraph blocks
          rtfContent += '\\pard\\sa200\\sl276\\slmult1 ' + this.escapeRTF(cleanPara) + '\\par\n';
        }
      });
    }

    rtfContent += '}';

    return new Blob([rtfContent], { type: 'application/rtf' });
  }

  private escapeRTF(text: string): string {
    return text.replace(/[\\{}]/g, '\\$&');
  }

  private async convertToEPUB(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    const zip = new JSZip();

    // EPUB structure
    zip.file('mimetype', 'application/epub+zip');

    // META-INF
    const metaInf = zip.folder('META-INF');
    metaInf?.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // OEBPS
    const oebps = zip.folder('OEBPS');

    // Chapters
    let chapterContent = '';

    if (fromFormat === 'csv') {
      chapterContent = this.csvToHTMLTable(content);
    } else if (fromFormat === 'md') {
      chapterContent = this.md.render(content);
    } else if (fromFormat === 'html') {
      chapterContent = content;
    } else {
      // Improved paragraph handling
      const paragraphs = content.split(/\n\s*\n/);
      chapterContent = paragraphs.map(para => {
        if (!para.trim()) return '';
        const cleanPara = para.replace(/\r/g, '').replace(/\n/g, ' ').trim();
        return `<p>${this.escapeHTML(cleanPara)}</p>`;
      }).join('');
    }

    const chapterXHTML = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter 1</title>
  <style>
    body { font-family: serif; line-height: 1.5; padding: 1em; } 
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th { background: #eee; font-weight: bold; text-align: left; }
    td, th { border: 1px solid #ddd; padding: 0.5em; }
  </style>
</head>
<body>
  ${chapterContent}
</body>
</html>`;

    // Content file
    oebps?.file('content.html', chapterXHTML);

    // Package file
    oebps?.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Converted Document</dc:title>
    <dc:creator>DocConverter Pro</dc:creator>
    <dc:identifier id="bookid">converted-doc-${Date.now()}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);

    // Table of contents
    oebps?.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="converted-doc-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>Converted Document</text></docTitle>
  <navMap>
    <navPoint id="content">
      <navLabel><text>Content</text></navLabel>
      <content src="content.html"/>
    </navPoint>
  </navMap>
</ncx>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  }

  // Helper: Convert rich PDF content to LaTeX
  private richPDFToLaTeX(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return this.richPDFContent?.plainText || '';
    }

    let latexBody = '';

    for (const element of this.richPDFContent.elements) {
      if (element.type === 'paragraph') {
        const escaped = element.text.replace(/[&%$#_{}~^\\]/g, '\\$&');
        if (element.fontSize >= 24) {
          latexBody += `\\section{${escaped}}\n`;
        } else if (element.fontSize >= 18) {
          latexBody += `\\subsection{${escaped}}\n`;
        } else {
          latexBody += `${escaped}\n\n`;
        }
      } else if (element.type === 'table') {
        if (element.rows.length > 0) {
          const colCount = element.rows[0].length;
          latexBody += `\\begin{table}[h]\n\\centering\n\\begin{tabular}{|${'c|'.repeat(colCount)}}\n\\hline\n`;
          
          element.rows.forEach((row, idx) => {
            const cells = row.map(cell => (cell.text || '').replace(/[&%$#_{}~^\\]/g, '\\$&'));
            latexBody += cells.join(' & ') + ' \\\\\n\\hline\n';
          });
          
          latexBody += '\\end{tabular}\n\\end{table}\n\n';
        }
      }
    }

    return latexBody;
  }

  // Helper: Extract tables as CSV
  private richPDFToCSV(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return '';
    }

    let csvContent = '';
    
    for (const element of this.richPDFContent.elements) {
      if (element.type === 'table') {
        element.rows.forEach(row => {
          const cells = row.map(cell => {
            const text = cell.text || '';
            // Escape quotes and wrap in quotes if contains comma/quote/newline
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          });
          csvContent += cells.join(',') + '\n';
        });
        csvContent += '\n'; // Blank line between tables
      }
    }

    return csvContent.trim();
  }

  // Helper: Convert rich PDF to JSON
  private richPDFToJSON(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return JSON.stringify({ text: this.richPDFContent?.plainText || '' }, null, 2);
    }

    const jsonData: any = {
      document: {
        paragraphs: [],
        tables: []
      }
    };

    for (const element of this.richPDFContent.elements) {
      if (element.type === 'paragraph') {
        jsonData.document.paragraphs.push({
          text: element.text,
          fontSize: element.fontSize,
          page: element.pageNumber
        });
      } else if (element.type === 'table') {
        jsonData.document.tables.push({
          rows: element.rows.map(row => row.map(cell => cell.text)),
          page: element.pageNumber
        });
      }
    }

    return JSON.stringify(jsonData, null, 2);
  }

  // Helper: Convert rich PDF to XML
  private richPDFToXML(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <text>${this.escapeHTML(this.richPDFContent?.plainText || '')}</text>\n</document>`;
    }

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<document>\n';

    for (const element of this.richPDFContent.elements) {
      if (element.type === 'paragraph') {
        xmlContent += `  <paragraph fontSize="${element.fontSize}" page="${element.pageNumber}">${this.escapeHTML(element.text)}</paragraph>\n`;
      } else if (element.type === 'table') {
        xmlContent += `  <table page="${element.pageNumber}">\n`;
        element.rows.forEach((row, idx) => {
          xmlContent += `    <row index="${idx}">\n`;
          row.forEach((cell, cellIdx) => {
            xmlContent += `      <cell index="${cellIdx}">${this.escapeHTML(cell.text || '')}</cell>\n`;
          });
          xmlContent += `    </row>\n`;
        });
        xmlContent += `  </table>\n`;
      }
    }

    xmlContent += '</document>';
    return xmlContent;
  }

  private async convertToLaTeX(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let latexContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{listings}
\\usepackage{xcolor}

\\title{Converted Document}
\\author{DocConverter Pro}
\\date{\\today}

\\begin{document}
\\maketitle

`;

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      latexContent += this.richPDFToLaTeX();
      this.richPDFContent = null;
    } else {
      switch (fromFormat) {
        case 'md':
          latexContent += this.markdownToLaTeX(content);
          break;
      case 'html':
        latexContent += this.htmlToLaTeX(content);
        break;
      case 'csv':
        try {
          const parsed = Papa.parse(content, { header: true });
          if (parsed.data && parsed.data.length > 0) {
            const headers = Object.keys(parsed.data[0] as any);
            const data = parsed.data as any[];

            // LaTeX Table
            latexContent += '\\begin{table}[h]\n';
            latexContent += '\\centering\n';
            latexContent += `\\begin{tabular}{|${headers.map(() => 'l').join('|')}|}\n`;
            latexContent += '\\hline\n';
            latexContent += `${headers.map(h => this.escapeLaTeX(h)).join(' & ')} \\\\\n`;
            latexContent += '\\hline\n';

            data.forEach(row => {
              latexContent += `${headers.map(h => this.escapeLaTeX(String(row[h] || ''))).join(' & ')} \\\\\n`;
            });

            latexContent += '\\hline\n';
            latexContent += '\\end{tabular}\n';
            latexContent += '\\caption{Converted Data}\n';
            latexContent += '\\end{table}\n';
          } else {
            latexContent += `\\begin{verbatim}\n${content}\n\\end{verbatim}`;
          }
        } catch {
          latexContent += `\\begin{verbatim}\n${content}\n\\end{verbatim}`;
        }
        break;
      default:
        latexContent += `\\begin{verbatim}\n${content}\n\\end{verbatim}`;
      }
    }

    latexContent += '\n\\end{document}';

    return new Blob([latexContent], { type: 'application/x-latex' });
  }

  private async convertToODT(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      content = this.richPDFContent.plainText;
      this.richPDFContent = null;
    }

    const zip = new JSZip();

    // Mimetype - MUST be first and uncompressed
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });

    let contentXMLBody = '';

    const hasImages = /<img[^>]*>/i.test(content);

    if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          contentXMLBody = this.csvToODFTable(parsed.data as any[], Object.keys(parsed.data[0] as any));
        } else {
          contentXMLBody = `<text:p>${this.escapeXML("No data found")}</text:p>`;
        }
      } catch {
        contentXMLBody = `<text:p>${this.escapeXML(content)}</text:p>`;
      }
    } else {
      let processedContent = content;
      if (fromFormat === 'md' || fromFormat === 'pdf') {
        processedContent = this.stripMarkdown(content);
      } else if (fromFormat === 'html') {
        processedContent = this.stripHTML(content);
      }

      // Improved paragraph handling
      const paragraphs = processedContent.split(/\n\s*\n/);
      contentXMLBody = paragraphs.map(para => {
        if (!para.trim()) return '';
        // Reflow text
        const cleanPara = para.replace(/\r/g, '').replace(/\n/g, ' ').trim();
        return `<text:p>${this.escapeXML(cleanPara)}</text:p>`;
      }).join('');

      if (hasImages) {
        contentXMLBody += `<text:p>${this.escapeXML('[Image omitted - not supported in ODT export]')}</text:p>`;
      }
    }

    // Manifest
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);

    // Content
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0">
  <office:body>
    <office:text>
      ${contentXMLBody}
    </office:text>
  </office:body>
</office:document-content>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.text' });
  }

  // Helper to generate OpenDocument Format Table XML
  private csvToODFTable(data: any[], headers: string[]): string {
    let xml = `<table:table table:name="Table1">`;

    // Columns (simple auto width)
    xml += `<table:table-column table:number-columns-repeated="${headers.length}"/>`;

    // Header Row
    xml += `<table:table-row>`;
    headers.forEach(h => {
      xml += `<table:table-cell office:value-type="string"><text:p>${this.escapeXML(h)}</text:p></table:table-cell>`;
    });
    xml += `</table:table-row>`;

    // Data Rows
    data.forEach(row => {
      xml += `<table:table-row>`;
      headers.forEach(h => {
        xml += `<table:table-cell office:value-type="string"><text:p>${this.escapeXML(String(row[h] || ''))}</text:p></table:table-cell>`;
      });
      xml += `</table:table-row>`;
    });

    xml += `</table:table>`;
    return xml;
  }

  // Helper methods for format conversion
  private markdownToLaTeX(markdown: string): string {
    return markdown
      .replace(/^# (.+)$/gm, '\\section{$1}')
      .replace(/^## (.+)$/gm, '\\subsection{$1}')
      .replace(/^### (.+)$/gm, '\\subsubsection{$1}')
      .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
      .replace(/\*(.+?)\*/g, '\\textit{$1}')
      .replace(/`(.+?)`/g, '\\texttt{$1}')
      .replace(/\n\n/g, '\n\n\\par\n');
  }

  private htmlToLaTeX(html: string): string {
    // Basic HTML to LaTeX conversion
    return this.stripHTML(html)
      .replace(/&/g, '\\&')
      .replace(/_/g, '\\_')
      .replace(/%/g, '\\%');
  }

  private escapeLaTeX(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/&/g, '\\&')
      .replace(/_/g, '\\_')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ... existing helper methods remain the same ...
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .trim();
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ... rest of existing methods remain the same but with enhanced error handling ...

  // Helper: Convert rich PDF content to Markdown
  private richPDFToMarkdown(): string {
    if (!this.richPDFContent || this.richPDFContent.elements.length === 0) {
      return this.richPDFContent?.plainText || '';
    }

    let mdContent = '# Converted Document\n\n';

    for (const element of this.richPDFContent.elements) {
      if (element.type === 'paragraph') {
        // Add headings based on font size
        if (element.fontSize >= 24) {
          mdContent += `# ${element.text}\n\n`;
        } else if (element.fontSize >= 18) {
          mdContent += `## ${element.text}\n\n`;
        } else if (element.fontSize >= 14) {
          mdContent += `### ${element.text}\n\n`;
        } else {
          mdContent += `${element.text}\n\n`;
        }
      } else if (element.type === 'table') {
        // Convert to Markdown table
        if (element.rows.length > 0) {
          const firstRow = element.rows[0];
          
          // Table header
          mdContent += '| ' + firstRow.map(cell => cell.text || ' ').join(' | ') + ' |\n';
          mdContent += '| ' + firstRow.map(() => '---').join(' | ') + ' |\n';
          
          // Table body (skip first row as it's the header)
          for (let i = 1; i < element.rows.length; i++) {
            const row = element.rows[i];
            mdContent += '| ' + row.map(cell => (cell.text || ' ').replace(/\|/g, '\\|')).join(' | ') + ' |\n';
          }
          
          mdContent += '\n';
        }
      }
    }

    return mdContent;
  }

  private async convertToMarkdown(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let mdContent = '';

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      mdContent = this.richPDFToMarkdown();
      this.richPDFContent = null; // Clean up
      return new Blob([mdContent], { type: 'text/markdown' });
    }

    switch (fromFormat) {
      case 'html':
        mdContent = this.turndown.turndown(content);
        break;

      case 'txt':
        // Convert plain text to markdown with basic formatting
        mdContent = content
          .split('\n\n')
          .map(paragraph => paragraph.trim())
          .filter(paragraph => paragraph.length > 0)
          .join('\n\n');
        break;

      case 'json':
        try {
          const jsonData = JSON.parse(content);
          mdContent = `# JSON Document\n\n\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\``;
        } catch {
          mdContent = `# Document\n\n\`\`\`\n${content}\n\`\`\``;
        }
        break;

      case 'csv':
        try {
          // Robust CSV to Markdown Table
          const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
          if (parsed.data && parsed.data.length > 0) {
            const headers = Object.keys(parsed.data[0] as any);
            const data = parsed.data as any[];

            // Markdown Table Header
            mdContent = '| ' + headers.join(' | ') + ' |\n';
            mdContent += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

            // Markdown Table Rows
            data.forEach(row => {
              // Escape pipes in content to prevent breaking md table
              const rowStr = headers.map(h => {
                let val = String(row[h] || '');
                return val.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
              }).join(' | ');
              mdContent += '| ' + rowStr + ' |\n';
            });
          } else {
            mdContent = this.csvToMarkdownTable(content);
          }
        } catch (e) {
          console.warn('Papa parse failed for md, falling back to manual', e);
          mdContent = this.csvToMarkdownTable(content);
        }
        break;

      default:
        mdContent = content;
    }

    return new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  }

  private async convertToText(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let textContent = '';

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      // Use plain text representation with formatted tables
      textContent = this.richPDFContent.plainText;
      this.richPDFContent = null;
      return new Blob([textContent], { type: 'text/plain' });
    }

    switch (fromFormat) {
      case 'html':
        textContent = this.stripHTML(content);
        break;

      case 'md':
        textContent = this.stripMarkdown(content);
        break;

      case 'json':
        try {
          const jsonData = JSON.parse(content);
          textContent = JSON.stringify(jsonData, null, 2);
        } catch {
          textContent = content;
        }
        break;

      case 'csv':
        // Convert CSV to aligned text table
        try {
          const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
          if (parsed.data && parsed.data.length > 0) {
            const headers = Object.keys(parsed.data[0] as any);
            const data = parsed.data as any[];

            // Calculate column widths
            const colWidths = headers.map(h => h.length);
            data.forEach(row => {
              headers.forEach((h, i) => {
                const val = String(row[h] || '');
                if (val.length > colWidths[i]) colWidths[i] = val.length;
              });
            });

            // Add padding
            const padding = 2;
            const paddedHeaders = headers.map((h, i) => h.padEnd(colWidths[i] + padding));

            // Header
            textContent = paddedHeaders.join('') + '\n';

            // Separator
            textContent += headers.map((h, i) => '-'.repeat(colWidths[i] + padding)).join('') + '\n';

            // Data
            data.forEach(row => {
              textContent += headers.map((h, i) => String(row[h] || '').padEnd(colWidths[i] + padding)).join('') + '\n';
            });
          } else {
            textContent = content;
          }
        } catch {
          const lines = content.split('\n');
          textContent = lines.map(line => line.replace(/,/g, ' | ')).join('\n');
        }
        break;

      case 'xml':
        textContent = this.stripHTML(content); // XML tags are similar to HTML
        break;

      default:
        textContent = content;
    }

    return new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  }

  private async convertToDocx(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    // Add Title
    children.push(new Paragraph({
      text: "Converted Document",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }));

    // Handle rich PDF content if available (tables and images)
    if (fromFormat === 'pdf' && this.richPDFContent && this.richPDFContent.elements.length > 0) {
      console.log(`Processing ${this.richPDFContent.elements.length} PDF elements (paragraphs, tables, images)`);
      
      for (const element of this.richPDFContent.elements) {
        if (element.type === 'paragraph') {
          // Add heading detection
          let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
          if (element.fontSize >= 24) {
            heading = HeadingLevel.HEADING_1;
          } else if (element.fontSize >= 18) {
            heading = HeadingLevel.HEADING_2;
          } else if (element.fontSize >= 14) {
            heading = HeadingLevel.HEADING_3;
          }

          children.push(new Paragraph({
            text: element.text,
            heading: heading,
            spacing: { after: 200 },
            alignment: AlignmentType.BOTH
          }));
        } else if (element.type === 'table') {
          // Create DOCX table from PDF table
          const tableRows = element.rows.map((row, rowIdx) => {
            return new TableRow({
              children: row.map((cell, cellIdx) => new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: cell.text,
                    bold: rowIdx === 0, // Make first row bold (header)
                    color: "000000"
                  })]
                })],
                shading: rowIdx === 0 ? { fill: "EFEFEF" } : undefined,
                width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                margins: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100
                }
              }))
            });
          });

          children.push(new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
            }
          }));

          // Add spacing after table
          children.push(new Paragraph({
            text: "",
            spacing: { after: 200 }
          }));
        } else if (element.type === 'image') {
          // Images are extracted separately and included in ZIP file
          // Only add placeholder if images will be in ZIP (they have data)
          if (this.richPDFContent && this.richPDFContent.images.length > 0) {
            children.push(new Paragraph({
              children: [
                new TextRun({
                  text: `[Image from Page ${element.pageNumber} - See 'image_page${element.pageNumber}_*.png' in the downloaded ZIP file]`,
                  italics: true,
                  color: "0066CC"
                })
              ],
              spacing: { after: 200 }
            }));
          }
        }
      }
    } else if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          const headers = Object.keys(parsed.data[0] as any);
          const data = parsed.data as any[];

          // Create Header Row
          const headerRow = new TableRow({
            children: headers.map(header => new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: header, bold: true, color: "000000" })]
              })],
              shading: { fill: "EFEFEF" },
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
            }))
          });

          // Create Data Rows
          const dataRows = data.map(row =>
            new TableRow({
              children: headers.map(header => new TableCell({
                children: [new Paragraph(String(row[header] || ''))],
                width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
              }))
            })
          );

          children.push(new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE }
          }));
        } else {
          children.push(new Paragraph("No data found in CSV."));
        }
      } catch (e) {
        console.warn('Failed to parse CSV for DOCX', e);
        children.push(new Paragraph(content));
      }
    } else if (fromFormat === 'html' || fromFormat === 'docx' || fromFormat === 'doc') {
      const hasTables = /<table/i.test(content);
      const hasImages = /<img[^>]*src=/i.test(content);

      // Parse basic HTML tables to DOCX tables
      if (hasTables && typeof DOMParser !== 'undefined') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          const tables = Array.from(doc.querySelectorAll('table'));

          tables.forEach(table => {
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length === 0) return;

            // Build DOCX table rows
            const docxRows = rows.map(tr => {
              const cells = Array.from(tr.querySelectorAll('th,td'));
              return new TableRow({
                children: cells.map(td => new TableCell({
                  children: [new Paragraph(td.textContent?.trim() || '')],
                  width: { size: 100 / Math.max(cells.length, 1), type: WidthType.PERCENTAGE }
                }))
              });
            });

            children.push(new Table({
              rows: docxRows,
              width: { size: 100, type: WidthType.PERCENTAGE }
            }));
          });
        } catch (e) {
          console.warn('Failed to parse HTML tables for DOCX', e);
        }
      }

      if (hasImages) {
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: '[Image omitted - embedding not available in current converter]',
              italics: true
            })
          ]
        }));
      }

      // Add plain text content for the rest
      const textContent = this.stripHTML(content);
      const paragraphs = textContent.split(/\n\s*\n/);
      paragraphs.forEach(para => {
        if (para.trim()) {
          const cleanPara = para.replace(/\r/g, '').replace(/\n/g, ' ').trim();
          children.push(new Paragraph({
            text: cleanPara,
            spacing: { after: 200 },
            alignment: AlignmentType.BOTH
          }));
        }
      });
    } else if (fromFormat === 'md' || fromFormat === 'pdf') {
      // Parse Markdown for DOCX
      const lines = content.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        // Headings
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          const headingLevel =
            level === 1 ? HeadingLevel.HEADING_1 :
              level === 2 ? HeadingLevel.HEADING_2 :
                level === 3 ? HeadingLevel.HEADING_3 :
                  level === 4 ? HeadingLevel.HEADING_4 :
                    level === 5 ? HeadingLevel.HEADING_5 : HeadingLevel.HEADING_6;

          children.push(new Paragraph({
            text: text,
            heading: headingLevel,
            spacing: { before: 200, after: 100 }
          }));
        }
        // List Items
        else if (trimmed.match(/^[\*\-]\s+(.+)$/)) {
          const text = trimmed.replace(/^[\*\-]\s+/, '');
          children.push(new Paragraph({
            text: text,
            bullet: { level: 0 }
          }));
        }
        // Ordered List
        else if (trimmed.match(/^\d+\.\s+(.+)$/)) {
          const text = trimmed.replace(/^\d+\.\s+/, '');
          children.push(new Paragraph({
            text: text,
            bullet: { level: 0 } // docx simple support for now, ideally numbering
          }));
        }
        else {
          // Plain text
          children.push(new Paragraph(trimmed));
        }
      });
    } else {
      // Handle Text/PDF to DOCX (html and md are handled above)
      let textContent = content;

      // Better paragraph handling for PDF/Text
      // Split by double newline for paragraphs to capture structure
      const paragraphs = textContent.split(/\n\s*\n/);

      paragraphs.forEach(para => {
        if (para.trim()) {
          // For PDFs and wrapped text, join single newlines with spaces for better reflow
          // unless it looks like a list or specific formatting
          const cleanPara = para.replace(/\r/g, '').replace(/\n/g, ' ').trim();

          children.push(new Paragraph({
            text: cleanPara,
            spacing: { after: 200 }, // Standard paragraph spacing
            alignment: AlignmentType.BOTH // Justify text for professional look
          }));
        }
      });
    }

    const doc = new Document({
      creator: 'DocConverter Pro',
      title: 'Converted Document',
      sections: [{
        properties: {},
        children: children
      }]
    });

    // Clean up rich PDF content after use
    if (this.richPDFContent) {
      this.richPDFContent = null;
    }

    return await Packer.toBlob(doc);
  }

  private async convertToDoc(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Convert to RTF format which is compatible with older Word versions
    return this.convertToRTF(content, fromFormat, options);
  }

  private async convertToPPTX(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();

    // Add Title
    slide.addText('Converted Document', { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true, color: '363636' });

    if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          const headers = Object.keys(parsed.data[0] as any);
          const data = parsed.data as any[];

          // Prepare table data for PptxGenJS
          // Row 1: Headers
          const tableData: any[] = [
            headers.map(h => ({ text: h, options: { fill: 'EFEFEF', color: '000000', bold: true } }))
          ];

          // Data Rows
          data.forEach(row => {
            tableData.push(headers.map(h => String(row[h] || '')));
          });

          slide.addTable(tableData, { x: 0.5, y: 1.5, w: '90%', fontSize: 10 });
        } else {
          slide.addText('No data found in CSV.', { x: 0.5, y: 1.5 });
        }
      } catch (e) {
        console.warn('Failed to parse CSV for PPTX', e);
        slide.addText(content.substring(0, 1000), { x: 0.5, y: 1.5, w: '90%', fontSize: 12 });
      }
    } else {
      // Handle Text/Markdown/HTML
      let textContent = content;
      if (fromFormat === 'html') textContent = this.stripHTML(content);
      if (fromFormat === 'md') textContent = this.stripMarkdown(content);

      // Basic text slide (handling long text)
      slide.addText(textContent.substring(0, 2000), { x: 0.5, y: 1.5, w: '90%', h: '80%', fontSize: 12, wrap: true });
    }

    return await pptx.write({ outputType: 'blob' }) as Blob;
  }

  private async convertToPPT(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // For older PPT format, we'll create a PPTX and let the user know it's in newer format
    return this.convertToPPTX(content, fromFormat, options);
  }

  private async convertToXLSX(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    try {
      // Use XLSX library for better Excel generation
      const workbook = XLSX.utils.book_new();
      let worksheetData: any[][] = [];

      switch (fromFormat) {
        case 'csv':
          try {
            const parsed = Papa.parse(content, { header: false });
            worksheetData = parsed.data as any[][];
          } catch {
            worksheetData = [['Error'], ['Failed to parse CSV data']];
          }
          break;
        case 'json':
          try {
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData)) {
              // Convert array of objects to 2D array
              if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
                const headers = Object.keys(jsonData[0]);
                worksheetData = [headers, ...jsonData.map(obj => headers.map(key => obj[key]))];
              } else {
                worksheetData = [['Value'], ...jsonData.map(item => [item])];
              }
            } else {
              // Convert object to key-value pairs
              worksheetData = [['Key', 'Value'], ...Object.entries(jsonData)];
            }
          } catch {
            worksheetData = [['Error'], ['Failed to parse JSON data']];
          }
          break;
        case 'txt':
          // Convert text lines to rows
          const lines = content.split('\n').filter(line => line.trim());
          worksheetData = [['Line', 'Content'], ...lines.map((line, index) => [index + 1, line])];
          break;
        default:
          // For other formats, create a simple text content sheet
          worksheetData = [['Content'], [content]];
      }

      // Create worksheet from data
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    } catch (error) {
      console.warn('Failed to create XLSX with XLSX library, falling back to basic method');
      // Fallback to the original method
      return this.convertToXLSXFallback(content, fromFormat, options);
    }
  }

  private async convertToXLSXFallback(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Original XLSX creation method as fallback
    const zip = new JSZip();

    // Process content based on source format
    let worksheetData = '';

    switch (fromFormat) {
      case 'csv':
        try {
          const parsed = Papa.parse(content, { header: false });
          worksheetData = this.csvToXLSXWorksheet(parsed.data as any[][]);
        } catch {
          worksheetData = this.textToXLSXWorksheet(content);
        }
        break;
      case 'json':
        try {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            const csvData = Papa.unparse(jsonData);
            const parsed = Papa.parse(csvData, { header: false });
            worksheetData = this.csvToXLSXWorksheet(parsed.data as any[][]);
          } else {
            worksheetData = this.objectToXLSXWorksheet(jsonData);
          }
        } catch {
          worksheetData = this.textToXLSXWorksheet(content);
        }
        break;
      default:
        worksheetData = this.textToXLSXWorksheet(content);
    }

    // XLSX structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </sheets>
</workbook>`);

    zip.file('xl/worksheets/sheet1.xml', worksheetData);

    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private async convertToXLS(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // For older XLS format, we'll create an XLSX and let the user know it's in newer format
    return this.convertToXLSX(content, fromFormat, options);
  }

  private async convertToODP(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Create OpenDocument Presentation format
    const zip = new JSZip();

    let processedContent = content;

    if (fromFormat === 'csv') {
      // Use Markdown table fallback for ODP slides - properly escaped
      // Actually, let's use the object table generator we made for better quality
      processedContent = ''; // Will be handled by slide structure
    } else if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }

    // ODP structure
    // ODP structure
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);

    let slideContentXML = '';

    if (fromFormat === 'csv') {
      try {
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          slideContentXML = `<draw:frame draw:style-name="standard" draw:layer="layout" svg:width="25cm" svg:height="15cm" svg:x="1.5cm" svg:y="1.5cm">
                                <draw:object>
                                   ${this.csvToODFTable(parsed.data as any[], Object.keys(parsed.data[0] as any))}
                                </draw:object>
                              </draw:frame>`;
        }
      } catch {
        slideContentXML = `<draw:text-box><text:p>${this.escapeXML(content)}</text:p></draw:text-box>`;
      }
    } else {
      slideContentXML = `<draw:text-box><text:p>${this.escapeXML(processedContent)}</text:p></draw:text-box>`;
    }

    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
                        xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0">
  <office:body>
    <office:presentation>
      <draw:page draw:name="Slide1">
        ${slideContentXML}
      </draw:page>
    </office:presentation>
  </office:body>
</office:document-content>`);

    zip.file('styles.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:styles>
    <style:default-style style:family="paragraph"/>
  </office:styles>
</office:document-styles>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.presentation' });
  }

  // Helper methods for XLSX conversion
  private csvToXLSXWorksheet(data: any[][]): string {
    let worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>`;

    data.forEach((row, rowIndex) => {
      worksheet += `<row r="${rowIndex + 1}">`;
      row.forEach((cell, colIndex) => {
        const cellRef = this.numberToColumn(colIndex + 1) + (rowIndex + 1);
        worksheet += `<c r="${cellRef}" t="inlineStr"><is><t>${this.escapeXML(String(cell || ''))}</t></is></c>`;
      });
      worksheet += '</row>';
    });

    worksheet += `</sheetData></worksheet>`;
    return worksheet;
  }

  private textToXLSXWorksheet(text: string): string {
    const lines = text.split('\n');
    const data = lines.map(line => [line]);
    return this.csvToXLSXWorksheet(data);
  }

  private objectToXLSXWorksheet(obj: any): string {
    const headers = Object.keys(obj);
    const values = Object.values(obj);
    const data = [headers, values.map(v => String(v))];
    return this.csvToXLSXWorksheet(data);
  }

  private numberToColumn(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  private async convertToImage(content: string | ArrayBuffer, fromFormat: SupportedFormat, toFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'webp', options: ConversionOptions): Promise<Blob> {

    // 1. Specialized High-Fidelity PDF Handling
    if (fromFormat === 'pdf' && content instanceof ArrayBuffer) {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(content) }).promise;

        // Map format to MIME type (default to png if not supported by browser canvas)
        const mimeTypeMap: Record<string, string> = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'webp': 'image/webp'
        };
        const mimeType = mimeTypeMap[toFormat] || 'image/png';
        const fileExt = (toFormat === 'jpeg' || toFormat === 'jpg') ? 'jpg' : toFormat;

        const images: { blob: Blob; name: string }[] = [];

        // Render each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          // 2.0 scale offers good balance of quality and performance
          const viewport = page.getViewport({ scale: 2.0 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;

            const blob = await new Promise<Blob | null>(resolve =>
              canvas.toBlob(resolve, mimeType, 0.9)
            );

            if (blob) {
              images.push({
                blob,
                name: `page-${String(i).padStart(3, '0')}.${fileExt}`
              });
            }
          }
        }

        if (images.length === 0) throw new Error('Failed to render PDF pages');

        // Return single image or ZIP
        if (images.length === 1) {
          return images[0].blob;
        } else {
          const zip = new JSZip();
          images.forEach(img => zip.file(img.name, img.blob));
          return await zip.generateAsync({ type: 'blob' });
        }

      } catch (error) {
        console.error('PDF to Image conversion error', error);
        throw new Error('Failed to convert PDF to images');
      }
    }

    // 2. Standard Text/HTML/CSV Handling (Legacy)
    // Normalize content
    let textContent = '';
    if (typeof content === 'string') {
      textContent = content;
    } else {
      textContent = new TextDecoder().decode(content);
    }

    // Create a temporary HTML element to render content
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: -10000;
      width: max-content;
      min-width: 800px;
      min-height: 100px;
      padding: 40px;
      font-family: ${options.fontFamily || 'Arial, sans-serif'};
      font-size: ${options.fontSize || 16}px;
      line-height: 1.6;
      background: white;
      color: black;
      border: 1px solid #ddd;
      visibility: visible;
    `;

    // Process content for display
    let displayContent = '';
    switch (fromFormat) {
      case 'md':
      case 'pdf': // Treat processed PDF text (which is MD-like) as MD for image generation if we fell through here (e.g. if content was string)
        displayContent = this.md.render(textContent);
        break;
      case 'html':
        displayContent = textContent;
        break;
      case 'docx':
      case 'doc':
      case 'odt':
        // If DOCX was normalized to HTML, keep HTML so tables/images render; otherwise show text
        if (/<[a-z][\s\S]*>/i.test(textContent)) {
          displayContent = textContent;
        } else {
          displayContent = `<pre style="white-space: pre-wrap; font-family: ${options.fontFamily || 'Arial'};">${this.escapeHTML(textContent)}</pre>`;
        }
        break;
      case 'csv':
        // Add some basic styling for the image capture
        displayContent = `
          <style>
            table { border-collapse: collapse; width: 100%; border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            img { max-width: 100%; height: auto; }
          </style>
          ${this.csvToHTMLTable(textContent)}
        `;
        break;
      case 'txt':
        // Handle Logs/Text files explicitly for better rendering
        displayContent = `
           <div style="font-family: monospace; white-space: pre-wrap; word-break: break-all; color: #333; background: #f8f9fa; padding: 20px; border-radius: 8px;">
             ${this.escapeHTML(textContent)}
           </div>
        `;
        break;
      default:
        displayContent = `<pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">${this.escapeHTML(textContent)}</pre>`;
    }

    tempDiv.innerHTML = displayContent;
    document.body.appendChild(tempDiv);

    try {
      // Map format to MIME type
      const mimeTypeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp'
      };

      const mimeType = mimeTypeMap[toFormat] || 'image/png';
      const quality = options.quality === 'high' ? 0.95 : options.quality === 'low' ? 0.7 : 0.85;

      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Retain high quality
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth + 80, // Add buffer for padding
        height: tempDiv.scrollHeight + 80,
        windowWidth: tempDiv.scrollWidth + 100,
        windowHeight: tempDiv.scrollHeight + 100
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
          resolve(blob!);
        }, mimeType, quality);
      });

    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      throw new Error(`Failed to convert to image: ${error}`);
    }
  }

  // Helper methods for specific conversions
  private csvToMarkdownTable(csvContent: string): string {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const headers = lines[0].split(',').map(h => h.trim());
      let markdown = '# CSV Data\n\n';

      // Table header
      markdown += '| ' + headers.join(' | ') + ' |\n';
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

      // Table rows
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim());
        markdown += '| ' + cells.join(' | ') + ' |\n';
      }

      return markdown;
    } catch {
      return `# CSV Data\n\n\`\`\`\n${csvContent}\n\`\`\``;
    }
  }

  private jsonToXML(obj: any, rootName = 'root'): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>`;

    const convertValue = (value: any, key: string): string => {
      if (value === null || value === undefined) {
        return `<${key}></${key}>`;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.map(item => convertValue(item, key)).join('');
        } else {
          let result = `<${key}>`;
          for (const [k, v] of Object.entries(value)) {
            result += convertValue(v, k);
          }
          result += `</${key}>`;
          return result;
        }
      } else {
        return `<${key}>${this.escapeXML(String(value))}</${key}>`;
      }
    };

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        xml += convertValue(value, key);
      }
    } else {
      xml += this.escapeXML(String(obj));
    }

    xml += `</${rootName}>`;
    return xml;
  }

  private csvToXML(csvContent: string): string {
    try {
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';

      parsed.data.forEach((row: any, index: number) => {
        xml += `  <row id="${index + 1}">\n`;
        for (const [key, value] of Object.entries(row)) {
          const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
          xml += `    <${safeKey}>${this.escapeXML(String(value))}</${safeKey}>\n`;
        }
        xml += '  </row>\n';
      });

      xml += '</data>';
      return xml;
    } catch {
      return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <error>Failed to parse CSV</error>
  <content>${this.escapeXML(csvContent)}</content>
</document>`;
    }
  }

  // Batch conversion support
  async convertMultipleFiles(
    files: Array<{ content: string | ArrayBuffer; name: string; fromFormat: SupportedFormat }>,
    toFormat: SupportedFormat,
    options: ConversionOptions = {}
  ): Promise<Blob> {
    const zip = new JSZip();
    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    for (const file of files) {
      try {
        const result = await this.convertFile(file.content, file.fromFormat, toFormat, options);

        if (result.success && result.data) {
          const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + toFormat;
          zip.file(fileName, result.data);
          results.push({ name: fileName, success: true });
        } else {
          results.push({ name: file.name, success: false, error: result.error });
        }
      } catch (error) {
        results.push({
          name: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Add conversion report
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };

    zip.file('conversion-report.json', JSON.stringify(report, null, 2));

    return zip.generateAsync({
      type: 'blob',
      compression: options.compression ? 'DEFLATE' : 'STORE',
      compressionOptions: { level: 6 }
    });
  }

  // Format validation
  getSupportedFormats(): SupportedFormat[] {
    return [
      'txt', 'md', 'html', 'pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls',
      'rtf', 'epub', 'csv', 'json', 'xml', 'latex', 'odt', 'odp',
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'
    ];
  }

  getFormatInfo(format: SupportedFormat) {
    const formatInfo: Record<SupportedFormat, { name: string; description: string; mimeType: string; category: string }> = {
      txt: { name: 'Plain Text', description: 'Simple text file', mimeType: 'text/plain', category: 'Text' },
      md: { name: 'Markdown', description: 'Lightweight markup language', mimeType: 'text/markdown', category: 'Markup' },
      html: { name: 'HTML', description: 'HyperText Markup Language', mimeType: 'text/html', category: 'Web' },
      pdf: { name: 'PDF', description: 'Portable Document Format', mimeType: 'application/pdf', category: 'Document' },
      docx: { name: 'Word Document', description: 'Microsoft Word format', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'Document' },
      rtf: { name: 'Rich Text Format', description: 'Rich text document', mimeType: 'application/rtf', category: 'Document' },
      epub: { name: 'EPUB', description: 'Electronic publication format', mimeType: 'application/epub+zip', category: 'eBook' },
      csv: { name: 'CSV', description: 'Comma-separated values', mimeType: 'text/csv', category: 'Data' },
      json: { name: 'JSON', description: 'JavaScript Object Notation', mimeType: 'application/json', category: 'Data' },
      xml: { name: 'XML', description: 'Extensible Markup Language', mimeType: 'application/xml', category: 'Data' },
      latex: { name: 'LaTeX', description: 'Document preparation system', mimeType: 'application/x-latex', category: 'Academic' },
      png: { name: 'PNG Image', description: 'Portable Network Graphics', mimeType: 'image/png', category: 'Image' },
      jpg: { name: 'JPEG Image', description: 'Joint Photographic Experts Group', mimeType: 'image/jpeg', category: 'Image' },
      odt: { name: 'OpenDocument Text', description: 'Open standard document format', mimeType: 'application/vnd.oasis.opendocument.text', category: 'Document' },
      pptx: { name: 'PowerPoint Presentation', description: 'Microsoft PowerPoint format', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'Presentation' },
      ppt: { name: 'PowerPoint Presentation', description: 'Microsoft PowerPoint format', mimeType: 'application/vnd.ms-powerpoint', category: 'Presentation' },
      xlsx: { name: 'Excel Spreadsheet', description: 'Microsoft Excel format', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'Spreadsheet' },
      xls: { name: 'Excel Spreadsheet', description: 'Microsoft Excel format', mimeType: 'application/vnd.ms-excel', category: 'Spreadsheet' },
      gif: { name: 'GIF Image', description: 'Graphics Interchange Format', mimeType: 'image/gif', category: 'Image' },
      bmp: { name: 'Bitmap Image', description: 'Bitmap Graphics Format', mimeType: 'image/bmp', category: 'Image' },
      webp: { name: 'WebP Image', description: 'WebP Graphics Format', mimeType: 'image/webp', category: 'Image' },
      doc: { name: 'Word Document', description: 'Microsoft Word legacy format', mimeType: 'application/msword', category: 'Document' },
      jpeg: { name: 'JPEG Image', description: 'Joint Photographic Experts Group', mimeType: 'image/jpeg', category: 'Image' },
      odp: { name: 'OpenDocument Presentation', description: 'Open standard presentation format', mimeType: 'application/vnd.oasis.opendocument.presentation', category: 'Presentation' }
    };

    return formatInfo[format];
  }

  // Smart format suggestion
  suggestOptimalFormat(content: string, currentFormat: SupportedFormat): SupportedFormat[] {
    const suggestions: SupportedFormat[] = [];

    // Analyze content characteristics
    const hasStructure = content.includes('\n\n') || content.includes('#') || content.includes('<');
    const hasData = content.includes(',') || content.includes('\t') || content.includes('|');
    const isCode = content.includes('{') || content.includes('function') || content.includes('class');
    const isLong = content.length > 5000;

    // Make suggestions based on content analysis
    if (hasData && currentFormat !== 'csv') {
      suggestions.push('csv', 'json', 'xml');
    }

    if (hasStructure && currentFormat !== 'md') {
      suggestions.push('md', 'html');
    }

    if (isLong || hasStructure) {
      suggestions.push('pdf', 'docx');
    }

    if (isCode) {
      suggestions.push('html', 'md', 'pdf');
    }

    // Always suggest common formats
    if (!suggestions.includes('pdf')) suggestions.push('pdf');
    if (!suggestions.includes('txt')) suggestions.push('txt');

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  private async convertToCSV(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let csvContent = '';

    // Handle PDF with rich content (extract tables only)
    if (fromFormat === 'pdf' && this.richPDFContent) {
      csvContent = this.richPDFToCSV();
      this.richPDFContent = null;
      return new Blob([csvContent], { type: 'text/csv' });
    }

    switch (fromFormat) {
      case 'xlsx':
      case 'xls':
        try {
          // Use XLSX library to convert Excel to CSV
          const workbook = XLSX.read(content, { type: 'string' });

          // Convert the first worksheet to CSV
          if (workbook.SheetNames.length > 0) {
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            csvContent = XLSX.utils.sheet_to_csv(worksheet);
          } else {
            csvContent = 'Error,Message\n"No worksheets found","Excel file appears to be empty"';
          }
        } catch (error) {
          console.warn('Failed to convert Excel to CSV with XLSX library');
          csvContent = 'Error,Message\n"Conversion failed","Could not parse Excel file"';
        }
        break;
      case 'json':
        try {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            csvContent = Papa.unparse(jsonData);
          } else {
            // Convert object to CSV
            const headers = Object.keys(jsonData);
            const values = Object.values(jsonData);
            csvContent = headers.join(',') + '\n' + values.join(',');
          }
        } catch {
          csvContent = 'Error,Message\n"Invalid JSON","Could not parse JSON data"';
        }
        break;

      case 'xml':
        // Basic XML to CSV conversion (extract text content)
        const xmlText = this.stripHTML(content);
        csvContent = 'Content\n"' + xmlText.replace(/"/g, '""') + '"';
        break;

      case 'txt':
        // Convert text lines to CSV
        const lines = content.split('\n').filter(line => line.trim());
        csvContent = 'Line,Content\n' +
          lines.map((line, index) => `${index + 1},"${line.replace(/"/g, '""')}"`).join('\n');
        break;

      case 'pdf':
        // PDF text to CSV - split by paragraphs/pages
        const pdfLines = content.split('\n').filter(line => line.trim());
        csvContent = 'Line,Content\n' +
          pdfLines.map((line, index) => {
            // Handle page separators
            if (line.startsWith('--- Page')) {
              return `${index + 1},"[Page Break]"`;
            }
            return `${index + 1},"${line.replace(/"/g, '""')}"`;
          }).join('\n');
        break;

      default:
        csvContent = content;
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  private async convertToJSON(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let jsonContent = '';

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      jsonContent = this.richPDFToJSON();
      this.richPDFContent = null;
      return new Blob([jsonContent], { type: 'application/json' });
    }

    switch (fromFormat) {
      case 'csv':
        try {
          const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
          if (parsed.errors.length > 0) {
            throw new Error('CSV parsing failed');
          }
          jsonContent = JSON.stringify(parsed.data, null, 2);
        } catch (error) {
          console.warn('Failed to parse CSV, creating error JSON');
          jsonContent = JSON.stringify({
            error: 'Failed to parse CSV',
            message: error instanceof Error ? error.message : 'Unknown error',
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }, null, 2);
        }
        break;

      case 'xml':
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');

          // Check for parsing errors
          const parseError = xmlDoc.querySelector('parsererror');
          if (parseError) {
            throw new Error('XML parsing failed');
          }

          const jsonObj = this.xmlElementToObject(xmlDoc.documentElement);
          jsonContent = JSON.stringify(jsonObj, null, 2);
        } catch (error) {
          console.warn('Failed to parse XML, creating error JSON');
          jsonContent = JSON.stringify({
            error: 'Failed to parse XML',
            message: error instanceof Error ? error.message : 'Unknown error',
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }, null, 2);
        }
        break;

      case 'txt':
        // Convert text to structured JSON
        const lines = content.split('\n').filter(line => line.trim());
        const jsonObj = {
          metadata: {
            totalLines: lines.length,
            totalCharacters: content.length,
            convertedAt: new Date().toISOString()
          },
          content: {
            lines: lines,
            fullText: content
          }
        };
        jsonContent = JSON.stringify(jsonObj, null, 2);
        break;

      case 'html':
        try {
          // Extract structured data from HTML
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(content, 'text/html');

          const jsonObj = {
            metadata: {
              title: htmlDoc.title || 'Untitled',
              convertedAt: new Date().toISOString()
            },
            content: {
              text: htmlDoc.body?.textContent || '',
              headings: Array.from(htmlDoc.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
                level: parseInt(h.tagName.charAt(1)),
                text: h.textContent
              })),
              links: Array.from(htmlDoc.querySelectorAll('a[href]')).map(a => ({
                text: a.textContent,
                href: a.getAttribute('href')
              })),
              images: Array.from(htmlDoc.querySelectorAll('img[src]')).map(img => ({
                alt: img.getAttribute('alt'),
                src: img.getAttribute('src')
              }))
            }
          };
          jsonContent = JSON.stringify(jsonObj, null, 2);
        } catch (error) {
          jsonContent = JSON.stringify({
            error: 'Failed to parse HTML',
            message: error instanceof Error ? error.message : 'Unknown error',
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }, null, 2);
        }
        break;

      case 'md':
        try {
          // Extract structured data from Markdown
          const lines = content.split('\n');
          const headings = lines.filter(line => line.match(/^#{1,6}\s/));

          jsonContent = JSON.stringify({
            metadata: {
              totalLines: lines.length,
              headingCount: headings.length,
              convertedAt: new Date().toISOString()
            },
            content: {
              headings,
              plainText: this.stripMarkdown(content),
              rawMarkdown: content
            }
          }, null, 2);
        } catch (error) {
          jsonContent = JSON.stringify({
            error: 'Failed to parse Markdown',
            message: error instanceof Error ? error.message : 'Unknown error',
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }, null, 2);
        }
        break;

      case 'pdf':
        try {
          // Create structured PDF JSON with pages and paragraphs
          const pageChunks = content.split(/--- Page \d+ ---/);
          const pages = pageChunks.map((pageContent, index) => {
            const paragraphs = pageContent.split('\n\n').filter(p => p.trim());
            return {
              pageNumber: index + 1,
              paragraphs: paragraphs.map(p => p.trim()),
              wordCount: pageContent.split(/\s+/).filter(w => w.length > 0).length
            };
          }).filter(page => page.paragraphs.length > 0);

          jsonContent = JSON.stringify({
            metadata: {
              type: 'PDF Document',
              totalPages: pages.length,
              totalCharacters: content.length,
              convertedAt: new Date().toISOString()
            },
            pages: pages,
            fullText: content.replace(/--- Page \d+ ---/g, '').trim()
          }, null, 2);
        } catch (error) {
          jsonContent = JSON.stringify({
            error: 'Failed to process PDF content',
            message: error instanceof Error ? error.message : 'Unknown error',
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }, null, 2);
        }
        break;

      default:
        jsonContent = JSON.stringify({
          metadata: {
            sourceFormat: fromFormat,
            convertedAt: new Date().toISOString(),
            contentLength: content.length
          },
          content: content
        }, null, 2);
    }

    return new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  }

  private async convertToXML(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let xmlContent = '';

    // Handle PDF with rich content
    if (fromFormat === 'pdf' && this.richPDFContent) {
      xmlContent = this.richPDFToXML();
      this.richPDFContent = null;
      return new Blob([xmlContent], { type: 'application/xml' });
    }

    switch (fromFormat) {
      case 'json':
        try {
          const jsonData = JSON.parse(content);
          xmlContent = this.jsonToXML(jsonData, 'document');
        } catch (error) {
          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <error>Failed to parse JSON</error>
  <message>${error instanceof Error ? this.escapeXML(error.message) : 'Unknown error'}</message>
  <rawContent>${this.escapeXML(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</rawContent>
</document>`;
        }
        break;

      case 'csv':
        xmlContent = this.csvToXML(content);
        break;

      case 'txt':
        const lines = content.split('\n');
        xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <totalLines>${lines.length}</totalLines>
    <totalCharacters>${content.length}</totalCharacters>
    <convertedAt>${new Date().toISOString()}</convertedAt>
  </metadata>
  <content>`;

        lines.forEach((line, index) => {
          xmlContent += `<line number="${index + 1}">${this.escapeXML(line)}</line>`;
        });

        xmlContent += `</content>
</document>`;
        break;

      case 'html':
        try {
          // Convert HTML to XML by cleaning it up
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(content, 'text/html');

          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <title>${this.escapeXML(htmlDoc.title || 'Untitled')}</title>
    <convertedAt>${new Date().toISOString()}</convertedAt>
  </metadata>
  <content>
    <text>${this.escapeXML(htmlDoc.body?.textContent || '')}</text>
    <headings>`;

          htmlDoc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            xmlContent += `<heading level="${heading.tagName.charAt(1)}">${this.escapeXML(heading.textContent || '')}</heading>`;
          });

          xmlContent += `</headings>
    <links>`;

          htmlDoc.querySelectorAll('a[href]').forEach(link => {
            xmlContent += `<link href="${this.escapeXML(link.getAttribute('href') || '')}">${this.escapeXML(link.textContent || '')}</link>`;
          });

          xmlContent += `</links>
  </content>
</document>`;
        } catch (error) {
          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <error>Failed to parse HTML</error>
  <message>${error instanceof Error ? this.escapeXML(error.message) : 'Unknown error'}</message>
  <rawContent>${this.escapeXML(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</rawContent>
</document>`;
        }
        break;

      case 'md':
        try {
          const lines = content.split('\n');
          const headings = lines.filter(line => line.match(/^#{1,6}\s/));

          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <totalLines>${lines.length}</totalLines>
    <headingCount>${headings.length}</headingCount>
    <convertedAt>${new Date().toISOString()}</convertedAt>
  </metadata>
  <content>
    <plainText>${this.escapeXML(this.stripMarkdown(content))}</plainText>
    <headings>`;

          headings.forEach(heading => {
            const match = heading.match(/^(#{1,6})\s(.+)$/);
            if (match) {
              xmlContent += `<heading level="${match[1].length}">${this.escapeXML(match[2])}</heading>`;
            }
          });

          xmlContent += `</headings>
    <rawMarkdown>${this.escapeXML(content)}</rawMarkdown>
  </content>
</document>`;
        } catch (error) {
          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <error>Failed to parse Markdown</error>
  <message>${error instanceof Error ? this.escapeXML(error.message) : 'Unknown error'}</message>
  <rawContent>${this.escapeXML(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</rawContent>
</document>`;
        }
        break;

      case 'pdf':
        try {
          // Create structured PDF XML with pages and paragraphs
          const pageChunks = content.split(/--- Page \d+ ---/);
          const pages = pageChunks.filter(p => p.trim());

          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document type="pdf">
  <metadata>
    <totalPages>${pages.length}</totalPages>
    <totalCharacters>${content.length}</totalCharacters>
    <convertedAt>${new Date().toISOString()}</convertedAt>
  </metadata>
  <content>`;

          pages.forEach((pageContent, index) => {
            const paragraphs = pageContent.split('\n\n').filter(p => p.trim());
            xmlContent += `
    <page number="${index + 1}">`;

            paragraphs.forEach((para, pIndex) => {
              xmlContent += `
      <paragraph id="${index + 1}-${pIndex + 1}">${this.escapeXML(para.trim())}</paragraph>`;
            });

            xmlContent += `
    </page>`;
          });

          xmlContent += `
  </content>
</document>`;
        } catch (error) {
          xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <error>Failed to process PDF content</error>
  <message>${error instanceof Error ? this.escapeXML(error.message) : 'Unknown error'}</message>
  <rawContent>${this.escapeXML(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</rawContent>
</document>`;
        }
        break;

      default:
        xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <sourceFormat>${fromFormat}</sourceFormat>
    <convertedAt>${new Date().toISOString()}</convertedAt>
    <contentLength>${content.length}</contentLength>
  </metadata>
  <content>${this.escapeXML(content)}</content>
</document>`;
    }

    return new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  }

  // Helper method to convert XML element to JSON object
  private xmlElementToObject(element: Element): any {
    const obj: any = {};

    // Handle attributes
    if (element.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }

    // Handle child elements
    if (element.children.length === 0) {
      // Leaf node - return text content
      const textContent = element.textContent?.trim();
      if (obj['@attributes']) {
        obj['#text'] = textContent;
        return obj;
      }
      return textContent;
    }

    // Process child elements
    for (const child of element.children) {
      const key = child.tagName;
      const value = this.xmlElementToObject(child);

      if (obj[key]) {
        // Multiple elements with same name - convert to array
        if (!Array.isArray(obj[key])) {
          obj[key] = [obj[key]];
        }
        obj[key].push(value);
      } else {
        obj[key] = value;
      }
    }

    return obj;
  }

  /**
   * Convert ArrayBuffer to base64 string for image embedding
   */
  private async arrayBufferToBase64(buffer: ArrayBuffer, format: SupportedFormat): Promise<string> {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
    return `data:${mimeType};base64,${base64}`;
  }
}

// Export singleton instance
export const conversionService = new ConversionService();

// Utility functions for file handling
export function downloadFile(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

export function getFileExtension(format: SupportedFormat): string {
  const extensions: Record<SupportedFormat, string> = {
    txt: 'txt', md: 'md', html: 'html', pdf: 'pdf', docx: 'docx', doc: 'doc',
    pptx: 'pptx', ppt: 'ppt', xlsx: 'xlsx', xls: 'xls',
    rtf: 'rtf', epub: 'epub', csv: 'csv', json: 'json', xml: 'xml',
    latex: 'tex', odt: 'odt', odp: 'odp',
    png: 'png', jpg: 'jpg', jpeg: 'jpeg', gif: 'gif', bmp: 'bmp', webp: 'webp'
  };
  return extensions[format];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}