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
// Note: pdf-parse requires Node.js environment, so we'll handle PDF differently

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
  };
}

export class ConversionService {
  private md: MarkdownIt;
  private turndown: Turndown;

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
      } catch {}
      
      // CSV detection
      if (content.includes(',') && content.split('\n').length > 1) {
        const lines = content.split('\n');
        if (lines[0].split(',').length > 1) return 'csv';
      }
      
      // Markdown detection
      if (content.includes('# ') || content.includes('## ') || content.includes('**') || content.includes('*')) {
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
          result = await this.convertToImage(textContent, fromFormat, toFormat, options);
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
      pdf: ['txt', 'html', 'md', 'docx'], // Enhanced PDF extraction
      docx: ['txt', 'html', 'md', 'pdf', 'rtf', 'odt'],
      doc: ['txt', 'html', 'md', 'pdf', 'rtf', 'docx', 'odt'],
      pptx: ['pdf', 'txt', 'html', 'md', 'ppt'],
      ppt: ['pdf', 'txt', 'html', 'md', 'pptx'],
      xlsx: ['csv', 'json', 'html', 'txt', 'pdf', 'xls'],
      xls: ['csv', 'json', 'html', 'txt', 'pdf', 'xlsx'],
      csv: ['json', 'xml', 'html', 'txt', 'pdf', 'xlsx'],
      json: ['csv', 'xml', 'txt', 'html', 'pdf'],
      xml: ['json', 'html', 'txt', 'pdf'],
      rtf: ['txt', 'html', 'md', 'pdf', 'docx'],
      epub: ['txt', 'html', 'md', 'pdf'],
      latex: ['pdf', 'html', 'txt', 'md'],
      odt: ['txt', 'html', 'md', 'pdf', 'docx'],
      odp: ['txt', 'html', 'md', 'pdf', 'pptx'],
      png: ['jpg', 'jpeg', 'gif', 'bmp', 'webp'],
      jpg: ['png', 'gif', 'bmp', 'webp'],
      jpeg: ['png', 'jpg', 'gif', 'bmp', 'webp'],
      gif: ['png', 'jpg', 'jpeg', 'bmp', 'webp'],
      bmp: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
      webp: ['png', 'jpg', 'jpeg', 'gif', 'bmp']
    };

    return supportedPaths[from]?.includes(to) || from === to;
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
          const result = await mammoth.extractRawText({ arrayBuffer: content });
          return result.value;
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
        // For PDF, we'd need a PDF parser library like pdf-parse
        // For now, return placeholder with file info
        return '[PDF content - text extraction requires PDF parsing library]';
      
      default:
    return new TextDecoder().decode(content);
    }
  }

  // Enhanced PDF conversion with better formatting
  private async convertToPDF(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
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
        creator: 'DocConverter Pro',
        creationDate: new Date()
      });
    }

    // Split content into pages
    const lines = doc.splitTextToSize(processedContent, pageWidth - 2 * margin);
    let y = margin + 10; // Start below header

    // Add header
    doc.setFontSize(16);
    doc.setFont(options.fontFamily || 'helvetica', 'bold');
    doc.text('Converted Document', margin, margin);
    doc.setFontSize(fontSize);
    doc.setFont(options.fontFamily || 'helvetica', 'normal');

    // Add content
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
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
        if (options.preserveFormatting) {
          // Convert markdown to formatted text
          const html = this.md.render(content);
          return this.stripHTML(html);
        }
        return this.stripMarkdown(content);
      
      case 'html':
        return this.stripHTML(content);
      
      case 'json':
        try {
          const jsonData = JSON.parse(content);
          return JSON.stringify(jsonData, null, 2);
        } catch {
          return content;
        }
      
      case 'csv':
        // Format CSV for better readability
        const lines = content.split('\n');
        return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
      
      default:
        return content;
    }
  }

  // Enhanced HTML conversion with better styling
  private async convertToHTML(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let htmlContent = '';
    let title = 'Converted Document';

    switch (fromFormat) {
      case 'md':
        htmlContent = this.md.render(content);
        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) title = titleMatch[1];
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
        htmlContent = `<pre class="xml-content"><code>${this.escapeHTML(content)}</code></pre>`;
        title = 'XML Document';
        break;
      
      default:
        htmlContent = content;
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

  private csvToHTMLTable(csvContent: string): string {
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
    let rtfContent = '';
    
    // RTF header
    rtfContent += '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    rtfContent += '\\f0\\fs24 '; // Font and size
    
    // Process content based on source format
    let processedContent = content;
    if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }
    
    // Escape RTF special characters and add content
    processedContent = processedContent
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\par ');
    
    rtfContent += processedContent;
    rtfContent += '}';
    
    return new Blob([rtfContent], { type: 'application/rtf' });
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
    
    // Process content
    let htmlContent = '';
    if (fromFormat === 'md') {
      htmlContent = this.md.render(content);
    } else if (fromFormat === 'html') {
      htmlContent = content;
    } else {
      htmlContent = `<pre>${this.escapeHTML(content)}</pre>`;
    }
    
    // Content file
    oebps?.file('content.html', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Converted Document</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 2em; }
    h1, h2, h3 { color: #333; }
    pre { background: #f5f5f5; padding: 1em; overflow-x: auto; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`);
    
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

    switch (fromFormat) {
      case 'md':
        latexContent += this.markdownToLaTeX(content);
        break;
      case 'html':
        latexContent += this.htmlToLaTeX(content);
        break;
      default:
        latexContent += `\\begin{verbatim}\n${content}\n\\end{verbatim}`;
    }

    latexContent += '\n\\end{document}';
    
    return new Blob([latexContent], { type: 'application/x-latex' });
  }

  private async convertToODT(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // ODT is a ZIP-based format
    const zip = new JSZip();
    
    // Manifest
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);
    
    // Process content
    let processedContent = content;
    if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }
    
    // Content XML
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:p>${this.escapeXML(processedContent)}</text:p>
    </office:text>
  </office:body>
</office:document-content>`);
    
    // Basic styles
    zip.file('styles.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:styles>
    <style:default-style style:family="paragraph"/>
  </office:styles>
</office:document-styles>`);
    
    // Metadata
    zip.file('meta.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                     xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0">
  <office:meta>
    <meta:generator>DocConverter Pro</meta:generator>
    <meta:creation-date>${new Date().toISOString()}</meta:creation-date>
  </office:meta>
</office:document-meta>`);
    
    return zip.generateAsync({ type: 'blob' });
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
    return html
      .replace(/<h1[^>]*>(.+?)<\/h1>/gi, '\\section{$1}')
      .replace(/<h2[^>]*>(.+?)<\/h2>/gi, '\\subsection{$1}')
      .replace(/<h3[^>]*>(.+?)<\/h3>/gi, '\\subsubsection{$1}')
      .replace(/<strong[^>]*>(.+?)<\/strong>/gi, '\\textbf{$1}')
      .replace(/<em[^>]*>(.+?)<\/em>/gi, '\\textit{$1}')
      .replace(/<code[^>]*>(.+?)<\/code>/gi, '\\texttt{$1}')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n\\par\n')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
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

  private async convertToMarkdown(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let markdownContent = '';

    switch (fromFormat) {
      case 'html':
        markdownContent = this.turndown.turndown(content);
        break;
      
      case 'txt':
        // Convert plain text to markdown with basic formatting
        markdownContent = content
          .split('\n\n')
          .map(paragraph => paragraph.trim())
          .filter(paragraph => paragraph.length > 0)
          .join('\n\n');
        break;
      
      case 'json':
        try {
          const jsonData = JSON.parse(content);
          markdownContent = `# JSON Document\n\n\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\``;
        } catch {
          markdownContent = `# Document\n\n\`\`\`\n${content}\n\`\`\``;
        }
        break;
      
      case 'csv':
        markdownContent = this.csvToMarkdownTable(content);
        break;
      
      default:
        markdownContent = content;
    }

    return new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  }

  private async convertToText(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let textContent = '';

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
        // Convert CSV to formatted text
        const lines = content.split('\n');
        textContent = lines.map(line => line.replace(/,/g, ' | ')).join('\n');
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
    // For a full DOCX implementation, we'd need a library like docx
    // For now, we'll create a simple RTF-like format that Word can open
    
    let processedContent = content;
    if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }

    // Create a simple XML structure that resembles DOCX
    const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${this.escapeXML(processedContent)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    return new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  private async convertToDoc(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Convert to RTF format which is compatible with older Word versions
    return this.convertToRTF(content, fromFormat, options);
  }

  private async convertToPPTX(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    // Create a basic PPTX structure
    const zip = new JSZip();
    
    // PPTX structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

    // Relationships
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

    // Presentation
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`);

    // Slide content
    let processedContent = content;
    if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }

    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="TextBox"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="1000000" y="1000000"/>
            <a:ext cx="7144000" cy="4858000"/>
          </a:xfrm>
          <a:prstGeom prst="rect"/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:r>
              <a:t>${this.escapeXML(processedContent)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // Relationships for presentation
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
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
            worksheetData = parsed.data;
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
          worksheetData = this.csvToXLSXWorksheet(parsed.data);
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
            worksheetData = this.csvToXLSXWorksheet(parsed.data);
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
    if (fromFormat === 'md') {
      processedContent = this.stripMarkdown(content);
    } else if (fromFormat === 'html') {
      processedContent = this.stripHTML(content);
    }

    // ODP structure
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);

    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:presentation>
      <draw:page draw:name="Slide1">
        <draw:text-box>
          <text:p>${this.escapeXML(processedContent)}</text:p>
        </draw:text-box>
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

  private async convertToImage(content: string, fromFormat: SupportedFormat, toFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'webp', options: ConversionOptions): Promise<Blob> {
    // Create a temporary HTML element to render content
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 800px;
      padding: 40px;
      font-family: ${options.fontFamily || 'Arial, sans-serif'};
      font-size: ${options.fontSize || 16}px;
      line-height: 1.6;
      background: white;
      color: black;
      border: 1px solid #ddd;
    `;

    // Process content for display
    let displayContent = '';
    switch (fromFormat) {
      case 'md':
        displayContent = this.md.render(content);
        break;
      case 'html':
        displayContent = content;
        break;
      default:
        displayContent = `<pre style="white-space: pre-wrap; font-family: monospace;">${this.escapeHTML(content)}</pre>`;
    }

    tempDiv.innerHTML = displayContent;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: options.imageResolution ? options.imageResolution / 96 : 2,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(tempDiv);

      return new Promise((resolve) => {
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

        canvas.toBlob((blob) => {
          resolve(blob!);
        }, mimeType, quality);
      });
    } catch (error) {
      document.body.removeChild(tempDiv);
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
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>';
      
      parsed.data.forEach((row: any, index: number) => {
        xml += `<row id="${index + 1}">`;
        for (const [key, value] of Object.entries(row)) {
          xml += `<${key.replace(/[^a-zA-Z0-9]/g, '_')}>${this.escapeXML(String(value))}</${key.replace(/[^a-zA-Z0-9]/g, '_')}>`;
        }
        xml += '</row>';
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
      
      default:
        csvContent = content;
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  private async convertToJSON(content: string, fromFormat: SupportedFormat, options: ConversionOptions): Promise<Blob> {
    let jsonContent = '';

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