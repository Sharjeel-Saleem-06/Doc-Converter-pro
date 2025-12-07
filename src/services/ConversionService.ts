import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface ConversionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  outputFormat?: string;
  convertedData?: Blob;
  convertedName?: string;
  error?: string;
}

export interface ConversionOptions {
  quality: number;
  compression: boolean;
  preserveFormatting: boolean;
  includeImages: boolean;
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: number;
  fontSize: number;
  fontFamily: string;
}

export interface ConversionProgress {
  fileId: string;
  progress: number;
  status: string;
  error?: string;
}

export type SupportedFormat = 
  | 'pdf' | 'docx' | 'doc' | 'txt' | 'md' | 'html' | 'rtf' | 'odt'
  | 'xlsx' | 'xls' | 'csv' | 'ods' | 'pptx' | 'ppt' | 'odp'
  | 'json' | 'xml' | 'epub' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'webp';

export const SUPPORTED_FORMATS: Record<string, SupportedFormat[]> = {
  'Documents': ['pdf', 'docx', 'doc', 'txt', 'md', 'html', 'rtf', 'odt', 'epub'],
  'Spreadsheets': ['xlsx', 'xls', 'csv', 'ods'],
  'Presentations': ['pptx', 'ppt', 'odp'],
  'Data': ['json', 'xml', 'csv'],
  'Images': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
};

export const FORMAT_DESCRIPTIONS: Record<SupportedFormat, string> = {
  'pdf': 'Portable Document Format',
  'docx': 'Microsoft Word Document',
  'doc': 'Microsoft Word 97-2003 Document',
  'txt': 'Plain Text',
  'md': 'Markdown',
  'html': 'HyperText Markup Language',
  'rtf': 'Rich Text Format',
  'odt': 'OpenDocument Text',
  'xlsx': 'Microsoft Excel Workbook',
  'xls': 'Microsoft Excel 97-2003 Workbook',
  'csv': 'Comma Separated Values',
  'ods': 'OpenDocument Spreadsheet',
  'pptx': 'Microsoft PowerPoint Presentation',
  'ppt': 'Microsoft PowerPoint 97-2003 Presentation',
  'odp': 'OpenDocument Presentation',
  'json': 'JavaScript Object Notation',
  'xml': 'Extensible Markup Language',
  'epub': 'Electronic Publication',
  'png': 'Portable Network Graphics',
  'jpg': 'JPEG Image',
  'jpeg': 'JPEG Image',
  'gif': 'Graphics Interchange Format',
  'bmp': 'Bitmap Image',
  'webp': 'WebP Image'
};

class ConversionService {
  private progressCallbacks: Map<string, (progress: ConversionProgress) => void> = new Map();

  // Register progress callback for a file
  onProgress(fileId: string, callback: (progress: ConversionProgress) => void) {
    this.progressCallbacks.set(fileId, callback);
  }

  // Remove progress callback
  removeProgressCallback(fileId: string) {
    this.progressCallbacks.delete(fileId);
  }

  // Emit progress update
  private emitProgress(fileId: string, progress: number, status: string, error?: string) {
    const callback = this.progressCallbacks.get(fileId);
    if (callback) {
      callback({ fileId, progress, status, error });
    }
  }

  // Get file extension from filename
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Detect file format from file
  detectFormat(file: File): SupportedFormat | null {
    const extension = this.getFileExtension(file.name);
    
    // Check if extension is supported
    for (const category of Object.values(SUPPORTED_FORMATS)) {
      if (category.includes(extension as SupportedFormat)) {
        return extension as SupportedFormat;
      }
    }
    
    // Fallback to MIME type detection
    const mimeTypeMap: Record<string, SupportedFormat> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt',
      'text/markdown': 'md',
      'text/html': 'html',
      'application/rtf': 'rtf',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'text/csv': 'csv',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      'application/json': 'json',
      'application/xml': 'xml',
      'text/xml': 'xml',
      'application/epub+zip': 'epub',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/webp': 'webp'
    };

    return mimeTypeMap[file.type] || null;
  }

  // Convert single file
  async convertFile(
    file: ConversionFile,
    targetFormat: SupportedFormat,
    options: Partial<ConversionOptions> = {}
  ): Promise<ConversionFile> {
    const defaultOptions: ConversionOptions = {
      quality: 85,
      compression: true,
      preserveFormatting: true,
      includeImages: true,
      pageSize: 'A4',
      orientation: 'portrait',
      margin: 20,
      fontSize: 12,
      fontFamily: 'Arial'
    };

    const conversionOptions = { ...defaultOptions, ...options };
    
    try {
      this.emitProgress(file.id, 0, 'Starting conversion...');
      
      const sourceFormat = this.detectFormat(file.file);
      if (!sourceFormat) {
        throw new Error('Unsupported file format');
      }

      this.emitProgress(file.id, 20, 'Reading file...');
      
      let convertedData: Blob;
      let convertedName: string;

      // Handle different conversion paths
      if (this.isTextFormat(sourceFormat) && this.isTextFormat(targetFormat)) {
        const result = await this.convertTextToText(file.file, sourceFormat, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else if (this.isSpreadsheetFormat(sourceFormat) && this.isSpreadsheetFormat(targetFormat)) {
        const result = await this.convertSpreadsheetToSpreadsheet(file.file, sourceFormat, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else if (this.isPresentationFormat(sourceFormat) && this.isPresentationFormat(targetFormat)) {
        const result = await this.convertPresentationToPresentation(file.file, sourceFormat, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else if (sourceFormat === 'pdf' && targetFormat !== 'pdf') {
        const result = await this.convertFromPDF(file.file, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else if (sourceFormat !== 'pdf' && targetFormat === 'pdf') {
        const result = await this.convertToPDF(file.file, sourceFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else if (this.isImageFormat(sourceFormat) && this.isImageFormat(targetFormat)) {
        const result = await this.convertImageToImage(file.file, sourceFormat, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      } else {
        // Generic conversion through intermediate format
        const result = await this.convertGeneric(file.file, sourceFormat, targetFormat, conversionOptions);
        convertedData = result.data;
        convertedName = result.name;
      }

      this.emitProgress(file.id, 100, 'Conversion completed');

      return {
        ...file,
        status: 'completed',
        progress: 100,
        outputFormat: targetFormat,
        convertedData,
        convertedName
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.emitProgress(file.id, 0, 'Error', errorMessage);
      
      return {
        ...file,
        status: 'error',
        progress: 0,
        error: errorMessage
      };
    }
  }

  // Convert multiple files
  async convertFiles(
    files: ConversionFile[],
    targetFormat: SupportedFormat,
    options: Partial<ConversionOptions> = {}
  ): Promise<ConversionFile[]> {
    const results: ConversionFile[] = [];
    
    for (const file of files) {
      const result = await this.convertFile(file, targetFormat, options);
      results.push(result);
    }
    
    return results;
  }

  // Download single converted file
  downloadFile(file: ConversionFile) {
    if (!file.convertedData || !file.convertedName) {
      throw new Error('No converted data available');
    }
    
    saveAs(file.convertedData, file.convertedName);
  }

  // Download multiple files as ZIP
  async downloadAsZip(files: ConversionFile[], zipName: string = 'converted_files.zip') {
    const zip = new JSZip();
    
    for (const file of files) {
      if (file.convertedData && file.convertedName) {
        zip.file(file.convertedName, file.convertedData);
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, zipName);
  }

  // Helper methods for format detection
  private isTextFormat(format: SupportedFormat): boolean {
    return ['txt', 'md', 'html', 'rtf', 'json', 'xml'].includes(format);
  }

  private isSpreadsheetFormat(format: SupportedFormat): boolean {
    return ['xlsx', 'xls', 'csv', 'ods'].includes(format);
  }

  private isPresentationFormat(format: SupportedFormat): boolean {
    return ['pptx', 'ppt', 'odp'].includes(format);
  }

  private isImageFormat(format: SupportedFormat): boolean {
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(format);
  }

  // Text format conversions
  private async convertTextToText(
    file: File,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    const text = await file.text();
    let convertedText = text;
    
    // Apply format-specific conversions
    if (sourceFormat === 'md' && targetFormat === 'html') {
      convertedText = this.markdownToHtml(text);
    } else if (sourceFormat === 'html' && targetFormat === 'txt') {
      convertedText = this.htmlToText(text);
    } else if (sourceFormat === 'json' && targetFormat === 'xml') {
      convertedText = this.jsonToXml(text);
    } else if (sourceFormat === 'xml' && targetFormat === 'json') {
      convertedText = this.xmlToJson(text);
    }
    
    const blob = new Blob([convertedText], { type: this.getMimeType(targetFormat) });
    const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    
    return { data: blob, name };
  }

  // Spreadsheet conversions
  private async convertSpreadsheetToSpreadsheet(
    file: File,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let outputData: ArrayBuffer;
    let mimeType: string;
    
    switch (targetFormat) {
      case 'xlsx':
        outputData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'xls':
        outputData = XLSX.write(workbook, { type: 'array', bookType: 'xls' });
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'csv':
        const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        outputData = new TextEncoder().encode(csvData);
        mimeType = 'text/csv';
        break;
      case 'ods':
        outputData = XLSX.write(workbook, { type: 'array', bookType: 'ods' });
        mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
        break;
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
    
    const blob = new Blob([outputData], { type: mimeType });
    const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    
    return { data: blob, name };
  }

  // Presentation conversions (basic implementation)
  private async convertPresentationToPresentation(
    file: File,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    // For now, we'll create a basic conversion
    // In a real implementation, you'd use libraries like officegen or similar
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a basic presentation structure
    const presentationData = this.createBasicPresentation(file.name, targetFormat);
    
    const blob = new Blob([presentationData], { type: this.getMimeType(targetFormat) });
    const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    
    return { data: blob, name };
  }

  // Convert to PDF
  private async convertToPDF(
    file: File,
    sourceFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: options.pageSize.toLowerCase() as any
    });

    if (this.isTextFormat(sourceFormat)) {
      const text = await file.text();
      const lines = pdf.splitTextToSize(text, 180);
      pdf.text(lines, options.margin, options.margin);
    } else if (this.isSpreadsheetFormat(sourceFormat)) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      
      const lines = pdf.splitTextToSize(csvData, 180);
      pdf.text(lines, options.margin, options.margin);
    } else if (this.isImageFormat(sourceFormat)) {
      const imageData = await this.fileToDataURL(file);
      pdf.addImage(imageData, 'JPEG', options.margin, options.margin, 160, 0);
    }

    const pdfBlob = pdf.output('blob');
    const name = file.name.replace(/\.[^/.]+$/, '.pdf');
    
    return { data: pdfBlob, name };
  }

  // Convert from PDF (basic text extraction)
  private async convertFromPDF(
    file: File,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    // This is a simplified implementation
    // In a real app, you'd use PDF.js or similar for proper text extraction
    const text = `Extracted content from ${file.name}\n\nThis is a placeholder for PDF text extraction.\nIn a production environment, you would use proper PDF parsing libraries.`;
    
    let convertedData: string;
    let mimeType: string;
    
    switch (targetFormat) {
      case 'txt':
        convertedData = text;
        mimeType = 'text/plain';
        break;
      case 'md':
        convertedData = `# ${file.name}\n\n${text}`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        convertedData = `<html><head><title>${file.name}</title></head><body><h1>${file.name}</h1><p>${text.replace(/\n/g, '<br>')}</p></body></html>`;
        mimeType = 'text/html';
        break;
      default:
        convertedData = text;
        mimeType = 'text/plain';
    }
    
    const blob = new Blob([convertedData], { type: mimeType });
    const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    
    return { data: blob, name };
  }

  // Image format conversions
  private async convertImageToImage(
    file: File,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
              resolve({ data: blob, name });
            } else {
              reject(new Error('Failed to convert image'));
            }
          }, this.getMimeType(targetFormat), options.quality / 100);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Generic conversion fallback
  private async convertGeneric(
    file: File,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options: ConversionOptions
  ): Promise<{ data: Blob; name: string }> {
    // Fallback: convert through text intermediate
    const text = await file.text();
    const blob = new Blob([text], { type: this.getMimeType(targetFormat) });
    const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    
    return { data: blob, name };
  }

  // Utility methods
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  }

  private htmlToText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private jsonToXml(json: string): string {
    try {
      const obj = JSON.parse(json);
      return this.objectToXml(obj, 'root');
    } catch {
      return `<error>Invalid JSON</error>`;
    }
  }

  private objectToXml(obj: any, rootName: string): string {
    let xml = `<${rootName}>`;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        xml += this.objectToXml(obj[key], key);
      } else {
        xml += `<${key}>${obj[key]}</${key}>`;
      }
    }
    
    xml += `</${rootName}>`;
    return xml;
  }

  private xmlToJson(xml: string): string {
    // Simplified XML to JSON conversion
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const obj = this.xmlToObject(xmlDoc.documentElement);
      return JSON.stringify(obj, null, 2);
    } catch {
      return '{"error": "Invalid XML"}';
    }
  }

  private xmlToObject(element: Element): any {
    const obj: any = {};
    
    if (element.children.length === 0) {
      return element.textContent;
    }
    
    for (const child of element.children) {
      const key = child.tagName;
      const value = this.xmlToObject(child);
      
      if (obj[key]) {
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

  private createBasicPresentation(fileName: string, format: SupportedFormat): ArrayBuffer {
    // Create a basic presentation structure
    const content = `Basic presentation converted from ${fileName}`;
    return new TextEncoder().encode(content);
  }

  private async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getMimeType(format: SupportedFormat): string {
    const mimeTypes: Record<SupportedFormat, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'html': 'text/html',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'csv': 'text/csv',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'ppt': 'application/vnd.ms-powerpoint',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      'json': 'application/json',
      'xml': 'application/xml',
      'epub': 'application/epub+zip',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }

  // Get supported output formats for a given input format
  getSupportedOutputFormats(inputFormat: SupportedFormat): SupportedFormat[] {
    // Define conversion matrix
    const conversionMatrix: Record<SupportedFormat, SupportedFormat[]> = {
      'pdf': ['txt', 'md', 'html', 'docx'],
      'docx': ['pdf', 'txt', 'md', 'html', 'rtf', 'odt'],
      'doc': ['pdf', 'txt', 'md', 'html', 'rtf', 'docx'],
      'txt': ['pdf', 'md', 'html', 'docx', 'rtf'],
      'md': ['pdf', 'html', 'txt', 'docx'],
      'html': ['pdf', 'txt', 'md', 'docx'],
      'rtf': ['pdf', 'txt', 'md', 'html', 'docx'],
      'odt': ['pdf', 'txt', 'md', 'html', 'docx'],
      'xlsx': ['csv', 'xls', 'ods', 'pdf', 'html'],
      'xls': ['csv', 'xlsx', 'ods', 'pdf', 'html'],
      'csv': ['xlsx', 'xls', 'ods', 'pdf', 'html'],
      'ods': ['xlsx', 'xls', 'csv', 'pdf', 'html'],
      'pptx': ['pdf', 'ppt', 'odp', 'html'],
      'ppt': ['pdf', 'pptx', 'odp', 'html'],
      'odp': ['pdf', 'pptx', 'ppt', 'html'],
      'json': ['xml', 'txt', 'csv'],
      'xml': ['json', 'txt', 'html'],
      'epub': ['pdf', 'txt', 'html'],
      'png': ['jpg', 'jpeg', 'gif', 'bmp', 'webp', 'pdf'],
      'jpg': ['png', 'gif', 'bmp', 'webp', 'pdf'],
      'jpeg': ['png', 'gif', 'bmp', 'webp', 'pdf'],
      'gif': ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'pdf'],
      'bmp': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'],
      'webp': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'pdf']
    };
    
    return conversionMatrix[inputFormat] || [];
  }

  // Validate if conversion is supported
  isConversionSupported(inputFormat: SupportedFormat, outputFormat: SupportedFormat): boolean {
    const supportedOutputs = this.getSupportedOutputFormats(inputFormat);
    return supportedOutputs.includes(outputFormat);
  }

  // Get file size in human readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Estimate conversion time
  estimateConversionTime(file: ConversionFile, targetFormat: SupportedFormat): number {
    const baseTime = 1000; // 1 second base
    const sizeMultiplier = file.size / (1024 * 1024); // MB
    const complexityMultiplier = this.getComplexityMultiplier(
      this.detectFormat(file.file) || 'txt',
      targetFormat
    );
    
    return Math.max(baseTime, baseTime * sizeMultiplier * complexityMultiplier);
  }

  private getComplexityMultiplier(inputFormat: SupportedFormat, outputFormat: SupportedFormat): number {
    // Simple complexity estimation
    const complexFormats = ['pdf', 'docx', 'pptx', 'xlsx'];
    const inputComplex = complexFormats.includes(inputFormat);
    const outputComplex = complexFormats.includes(outputFormat);
    
    if (inputComplex && outputComplex) return 3;
    if (inputComplex || outputComplex) return 2;
    return 1;
  }
}

export const conversionService = new ConversionService();
export default conversionService; 