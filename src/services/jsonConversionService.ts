import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { XMLBuilder } from 'fast-xml-parser';

/**
 * Advanced JSON Converter Service
 * Supports JSON to: PDF, Plain Text, CSV, HTML, XML
 */

// Helper: Flatten nested JSON for CSV/tabular formats
function flattenJSON(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (obj[key] === null || obj[key] === undefined) {
                flattened[newKey] = '';
            } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenJSON(obj[key], newKey));
            } else if (Array.isArray(obj[key])) {
                flattened[newKey] = JSON.stringify(obj[key]);
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }

    return flattened;
}

// Helper: Convert JSON array to CSV string
function jsonArrayToCSV(jsonArray: any[]): string {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
        return '';
    }

    // Flatten all objects
    const flattenedData = jsonArray.map(item =>
        typeof item === 'object' ? flattenJSON(item) : { value: item }
    );

    // Get all unique headers
    const headers = Array.from(
        new Set(flattenedData.flatMap(obj => Object.keys(obj)))
    );

    // Create CSV header row
    const csvHeader = headers.map(h => `"${h}"`).join(',');

    // Create CSV data rows
    const csvRows = flattenedData.map(row =>
        headers.map(header => {
            const value = row[header] ?? '';
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
}

/**
 * Convert JSON to PDF with professional formatting
 * Intelligently detects document structures vs. data structures
 */
export async function jsonToPDF(jsonContent: string, fileName: string): Promise<Blob> {
    try {
        const data = JSON.parse(jsonContent);
        const pdf = new jsPDF();

        // Detect if this is a document-structured JSON (has pages, paragraphs, etc.)
        const isDocumentStructure = detectDocumentStructure(data);

        if (isDocumentStructure) {
            return generateDocumentPDF(data, fileName, pdf);
        } else {
            return generateDataPDF(data, fileName, pdf);
        }
    } catch (error) {
        throw new Error(`Failed to convert JSON to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Detect if JSON represents a document structure (pages, paragraphs, text content)
 */
function detectDocumentStructure(data: any): boolean {
    if (typeof data !== 'object' || data === null) return false;

    // Check for document indicators
    const hasPages = Array.isArray(data.pages) && data.pages.length > 0;
    const hasParagraphs = data.pages?.some((page: any) => Array.isArray(page.paragraphs));
    const hasFullText = typeof data.fullText === 'string';
    const hasMetadata = data.metadata && typeof data.metadata === 'object';

    return (hasPages && hasParagraphs) || (hasFullText && hasMetadata);
}

/**
 * Generate PDF from document-structured JSON
 */
function generateDocumentPDF(data: any, fileName: string, pdf: jsPDF): Blob {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 6;
    const paragraphSpacing = 8;

    // Add document header with metadata
    if (data.metadata) {
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.setFont('helvetica', 'italic');
        const metaDate = data.metadata.convertedAt ?
            new Date(data.metadata.convertedAt).toLocaleDateString() :
            new Date().toLocaleDateString();
        pdf.text(`Source: ${fileName} | Converted: ${metaDate}`, margin, 10);
        pdf.setTextColor(0);
    }

    let currentY = 20;

    // Process pages if available
    if (data.pages && Array.isArray(data.pages)) {
        data.pages.forEach((page: any, pageIndex: number) => {
            // Add page break for subsequent pages
            if (pageIndex > 0) {
                pdf.addPage();
                currentY = 20;
            }

            // Page number header
            pdf.setFontSize(9);
            pdf.setTextColor(150);
            pdf.text(`Page ${page.pageNumber || pageIndex + 1}`, pageWidth - margin - 20, 10, { align: 'right' });
            pdf.setTextColor(0);
            pdf.setFontSize(11);

            // Process paragraphs
            if (page.paragraphs && Array.isArray(page.paragraphs)) {
                page.paragraphs.forEach((paragraph: string, paraIndex: number) => {
                    // Check if paragraph looks like tabular/numerical data
                    if (isNumericalGrid(paragraph)) {
                        // Render as a formatted box
                        currentY = renderNumericalGrid(pdf, paragraph, margin, currentY, maxWidth);
                    } else {
                        // Regular paragraph
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(11);

                        // Split by newlines first to preserve structure
                        const lines = paragraph.split('\\n');
                        lines.forEach((line, lineIndex) => {
                            if (line.trim()) {
                                const wrappedLines = pdf.splitTextToSize(line, maxWidth);

                                wrappedLines.forEach((wrappedLine: string) => {
                                    // Check if we need a new page
                                    if (currentY + lineHeight > pageHeight - margin - 10) {
                                        pdf.addPage();
                                        currentY = margin;
                                    }

                                    pdf.text(wrappedLine, margin, currentY);
                                    currentY += lineHeight;
                                });
                            }

                            // Add spacing between lines within paragraph
                            if (lineIndex < lines.length - 1) {
                                currentY += 2;
                            }
                        });

                        // Spacing after paragraph
                        currentY += paragraphSpacing;
                    }
                });
            }

            // Add word count if available
            if (page.wordCount) {
                pdf.setFontSize(8);
                pdf.setTextColor(120);
                pdf.text(`Word count: ${page.wordCount}`, margin, pageHeight - 10);
                pdf.setTextColor(0);
            }
        });
    } else if (data.fullText) {
        // Fallback to fullText if pages not available
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);

        const paragraphs = data.fullText.split('\\n\\n');
        paragraphs.forEach((paragraph: string) => {
            if (paragraph.trim()) {
                const wrappedLines = pdf.splitTextToSize(paragraph, maxWidth);

                wrappedLines.forEach((line: string) => {
                    if (currentY + lineHeight > pageHeight - margin - 10) {
                        pdf.addPage();
                        currentY = margin;
                    }

                    pdf.text(line, margin, currentY);
                    currentY += lineHeight;
                });

                currentY += paragraphSpacing;
            }
        });
    }

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);

        // Document info footer
        if (data.metadata) {
            const footerText = `${data.metadata.type || 'Document'} | ${data.metadata.totalPages || totalPages} pages | ${data.metadata.totalCharacters || 0} characters`;
            pdf.text(footerText, margin, pageHeight - 5);
        }

        // Page number
        pdf.text(
            `${i} / ${totalPages}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
        );
    }

    return pdf.output('blob');
}

/**
 * Check if text looks like numerical grid/table data
 */
function isNumericalGrid(text: string): boolean {
    const lines = text.split('\\n');
    if (lines.length < 2) return false;

    // Check if most lines contain only numbers and spaces
    const numericalLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && /^[\d\s]+$/.test(trimmed);
    });

    return numericalLines.length >= lines.length * 0.8; // 80% or more are numerical
}

/**
 * Render numerical grid data in a formatted box
 */
function renderNumericalGrid(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
    const lines = text.split('\\n').filter(line => line.trim());
    const boxPadding = 10;
    const lineHeight = 8;
    const boxHeight = (lines.length * lineHeight) + (boxPadding * 2);

    // Draw box background
    pdf.setFillColor(245, 245, 250);
    pdf.rect(x, y, maxWidth, boxHeight, 'F');

    // Draw border
    pdf.setDrawColor(100, 100, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, maxWidth, boxHeight);

    // Render text centered
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(50);

    lines.forEach((line, index) => {
        const textY = y + boxPadding + (index * lineHeight) + 5;
        pdf.text(line.trim(), x + (maxWidth / 2), textY, { align: 'center' });
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);

    return y + boxHeight + 12; // Return new Y position
}

/**
 * Generate PDF from data-structured JSON (original implementation)
 */
function generateDataPDF(data: any, fileName: string, pdf: jsPDF): Blob {
    const margin = 14;

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('JSON Data', margin, 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Source: ${fileName}`, margin, 22);

    let yPosition = 30;

    // Handle different data structures
    if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'object') {
            // Array of objects - create table
            const flattenedData = data.map(item => flattenJSON(item));
            const headers = Array.from(
                new Set(flattenedData.flatMap(obj => Object.keys(obj)))
            );

            const tableData = flattenedData.map(row =>
                headers.map(header => {
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
                })
            );

            autoTable(pdf, {
                head: [headers],
                body: tableData,
                startY: yPosition,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                margin: { top: 30, left: margin, right: margin },
                theme: 'striped',
            });
        } else {
            // Simple array - display as list
            pdf.setFontSize(12);
            pdf.text('Array Data:', margin, yPosition);
            yPosition += 10;

            data.forEach((item, index) => {
                if (yPosition > 280) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.setFontSize(10);
                pdf.text(`[${index}]: ${String(item)}`, margin + 6, yPosition);
                yPosition += 7;
            });
        }
    } else if (typeof data === 'object') {
        // Single object - create key-value table
        const flattened = flattenJSON(data);
        const tableData = Object.entries(flattened).map(([key, value]) => [
            key,
            value === null || value === undefined ? '' :
                typeof value === 'object' ? JSON.stringify(value) : String(value)
        ]);

        autoTable(pdf, {
            head: [['Property', 'Value']],
            body: tableData,
            startY: yPosition,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' },
            },
            margin: { top: 30 },
            theme: 'grid',
        });
    } else {
        // Primitive value
        pdf.text(`Value: ${String(data)}`, margin, yPosition);
    }

    // Add footer with page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `Page ${i} of ${pageCount}`,
            pdf.internal.pageSize.width / 2,
            pdf.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    return pdf.output('blob');
}

/**
 * Convert JSON to formatted Plain Text
 */
export async function jsonToText(jsonContent: string, fileName: string): Promise<Blob> {
    try {
        const data = JSON.parse(jsonContent);

        let textOutput = `=== JSON Data ===\n`;
        textOutput += `Source: ${fileName}\n`;
        textOutput += `Generated: ${new Date().toLocaleString()}\n`;
        textOutput += `${'='.repeat(60)}\n\n`;

        function formatValue(value: any, indent: number = 0): string {
            const spaces = ' '.repeat(indent);

            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (typeof value === 'boolean') return value.toString();
            if (typeof value === 'number') return value.toString();
            if (typeof value === 'string') return value;

            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                let result = '[\n';
                value.forEach((item, index) => {
                    result += `${spaces}  [${index}] ${formatValue(item, indent + 2)}\n`;
                });
                result += `${spaces}]`;
                return result;
            }

            if (typeof value === 'object') {
                const entries = Object.entries(value);
                if (entries.length === 0) return '{}';
                let result = '{\n';
                entries.forEach(([key, val]) => {
                    result += `${spaces}  ${key}: ${formatValue(val, indent + 2)}\n`;
                });
                result += `${spaces}}`;
                return result;
            }

            return String(value);
        }

        textOutput += formatValue(data);
        textOutput += `\n\n${'='.repeat(60)}\n`;
        textOutput += `End of JSON Data\n`;

        return new Blob([textOutput], { type: 'text/plain;charset=utf-8' });
    } catch (error) {
        throw new Error(`Failed to convert JSON to Text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Convert JSON to CSV
 */
export async function jsonToCSV(jsonContent: string): Promise<Blob> {
    try {
        const data = JSON.parse(jsonContent);

        let csvContent: string;

        if (Array.isArray(data)) {
            if (data.length === 0) {
                throw new Error('JSON array is empty');
            }
            csvContent = jsonArrayToCSV(data);
        } else if (typeof data === 'object') {
            // Convert single object to CSV with one row
            csvContent = jsonArrayToCSV([data]);
        } else {
            // Primitive value - create simple CSV
            csvContent = `"Value"\n"${String(data).replace(/"/g, '""')}"`;
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    } catch (error) {
        throw new Error(`Failed to convert JSON to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Convert JSON to HTML with styled table
 */
export async function jsonToHTML(jsonContent: string, fileName: string): Promise<Blob> {
    try {
        const data = JSON.parse(jsonContent);

        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Data - ${fileName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 0.95em;
        }
        .content {
            padding: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .json-object {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .property {
            margin: 8px 0;
        }
        .key {
            color: #667eea;
            font-weight: 600;
        }
        .value {
            color: #333;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 JSON Data Visualization</h1>
            <p>Source: ${fileName} | Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
`;

        // Generate HTML based on data structure
        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object') {
                // Array of objects - create table
                const flattenedData = data.map(item => flattenJSON(item));
                const headers = Array.from(
                    new Set(flattenedData.flatMap(obj => Object.keys(obj)))
                );

                htmlContent += `            <h2>Data Table (${data.length} records)</h2>
            <table>
                <thead>
                    <tr>
${headers.map(header => `                        <th>${header}</th>`).join('\n')}
                    </tr>
                </thead>
                <tbody>
`;

                flattenedData.forEach(row => {
                    htmlContent += `                    <tr>\n`;
                    headers.forEach(header => {
                        const value = row[header];
                        const displayValue = value === null || value === undefined ? '' :
                            typeof value === 'object' ? JSON.stringify(value) :
                                String(value);
                        htmlContent += `                        <td>${displayValue}</td>\n`;
                    });
                    htmlContent += `                    </tr>\n`;
                });

                htmlContent += `                </tbody>
            </table>
`;
            } else {
                // Simple array
                htmlContent += `            <h2>Array Data (${data.length} items)</h2>
            <div class="json-object">
${data.map((item, index) => `                <div class="property"><span class="key">[${index}]:</span> <span class="value">${String(item)}</span></div>`).join('\n')}
            </div>
`;
            }
        } else if (typeof data === 'object') {
            // Single object
            const flattened = flattenJSON(data);
            htmlContent += `            <h2>Object Properties</h2>
            <table>
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
`;

            Object.entries(flattened).forEach(([key, value]) => {
                const displayValue = value === null || value === undefined ? '' :
                    typeof value === 'object' ? JSON.stringify(value) :
                        String(value);
                htmlContent += `                    <tr>
                        <td><strong>${key}</strong></td>
                        <td>${displayValue}</td>
                    </tr>
`;
            });

            htmlContent += `                </tbody>
            </table>
`;
        } else {
            // Primitive value
            htmlContent += `            <div class="json-object">
                <div class="property"><span class="key">Value:</span> <span class="value">${String(data)}</span></div>
            </div>
`;
        }

        htmlContent += `        </div>
        <div class="footer">
            Generated by DocConverter Pro | JSON to HTML Conversion
        </div>
    </div>
</body>
</html>`;

        return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    } catch (error) {
        throw new Error(`Failed to convert JSON to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Convert JSON to XML
 */
export async function jsonToXML(jsonContent: string): Promise<Blob> {
    try {
        const data = JSON.parse(jsonContent);

        // Create XML builder with options
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            format: true,
            indentBy: '  ',
            suppressEmptyNode: false,
            arrayNodeName: 'item',
            textNodeName: '#text',
        });

        // Wrap data in root element
        const wrappedData = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': 'UTF-8',
            },
            root: {
                '@_generated': new Date().toISOString(),
                '@_type': Array.isArray(data) ? 'array' : typeof data === 'object' ? 'object' : typeof data,
                data: data,
            },
        };

        const xmlContent = builder.build(wrappedData);

        return new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    } catch (error) {
        throw new Error(`Failed to convert JSON to XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
