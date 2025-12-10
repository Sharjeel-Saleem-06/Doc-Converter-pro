# PDF Conversion Methodology

## Overview
This document outlines the implementation plan for robust PDF-to-all-types conversion in DocConverter Pro. PDF is the most complex format to handle because it's primarily a visual format, not a structured data format.

## Current State Analysis

### PDF Parsing Challenge
PDF files store content as:
1. **Text streams** - Extractable with proper parsing
2. **Embedded fonts** - Can affect text extraction
3. **Images** - May contain scanned text (requires OCR)
4. **Vector graphics** - Layout/structure information
5. **Tables** - Not natively structured (visual positioning only)

### Current Implementation (Limited)
Location: `conversionService.ts` → `normalizeContent()` → `case 'pdf':`
```typescript
case 'pdf':
  return '[PDF content - text extraction requires PDF parsing library]';
```

---

## Implementation Plan

### Phase 1: Core PDF Text Extraction

#### Library Selection: `pdf-parse` (Recommended)
- **Why**: Lightweight, works in Node/Browser, extracts text reliably
- **Alternative**: `pdfjs-dist` (Mozilla's PDF.js) - more robust but heavier

#### Installation
```bash
npm install pdf-parse
# or for browser-compatible:
npm install pdfjs-dist
```

#### Implementation Steps
1. Add import: `import * as pdfjsLib from 'pdfjs-dist';`
2. Update `normalizeContent()` to extract text from PDF ArrayBuffer
3. Handle multi-page documents
4. Preserve paragraph breaks where possible

#### Code Pattern
```typescript
case 'pdf':
  try {
    const pdf = await pdfjsLib.getDocument({ data: content }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.warn('PDF text extraction failed:', error);
    return '[PDF content could not be extracted]';
  }
```

---

### Phase 2: PDF → Specific Format Conversions

#### 2.1 PDF → TXT (Plain Text)
- **Method**: Direct text extraction (Phase 1)
- **Output**: Clean text with paragraph breaks
- **Difficulty**: Easy

#### 2.2 PDF → MD (Markdown)
- **Method**: Extract text, detect headings (larger font sizes), detect lists
- **Implementation**:
  - Parse `textContent.items` with style info
  - Items with larger `height` → `# Heading`
  - Bullet patterns → `- List item`
- **Difficulty**: Medium

#### 2.3 PDF → HTML
- **Method**: Convert extracted text to semantic HTML
- **Implementation**:
  - Wrap paragraphs in `<p>` tags
  - Detect headings → `<h1>`, `<h2>`, etc.
  - Preserve basic structure
- **Difficulty**: Medium

#### 2.4 PDF → DOCX
- **Method**: Extract text → build DOCX using `docx` library
- **Implementation**:
  - Use existing `convertToDocx()` pattern
  - Feed extracted PDF text as input
- **Difficulty**: Easy (reuses existing code)

#### 2.5 PDF → CSV
- **Method**: Table extraction (complex)
- **Implementation**:
  - Use positional analysis of text items
  - Group items by Y-coordinate (rows)
  - Group by X-coordinate within rows (columns)
  - **Library option**: `pdf-table-extractor` or custom logic
- **Difficulty**: Hard

#### 2.6 PDF → JSON
- **Method**: Extract text → structure as JSON object
- **Output format**:
  ```json
  {
    "pages": [
      { "pageNumber": 1, "content": "..." },
      { "pageNumber": 2, "content": "..." }
    ],
    "metadata": { "title": "...", "author": "..." }
  }
  ```
- **Difficulty**: Easy

#### 2.7 PDF → XML
- **Method**: Similar to JSON, but XML structure
- **Difficulty**: Easy

#### 2.8 PDF → Image (PNG/JPG)
- **Method**: Render PDF pages to canvas
- **Implementation**:
  - Use `pdf.js` to render each page to canvas
  - Convert canvas to image blob
  - For multi-page: stitch vertically or create ZIP
- **Difficulty**: Medium

---

### Phase 3: Advanced Features (Future)

#### 3.1 OCR Support (Scanned PDFs)
- **Library**: `tesseract.js` (client-side OCR)
- **Flow**: Detect if PDF has no extractable text → render to image → OCR
- **Difficulty**: Hard

#### 3.2 Table Detection & Extraction
- **Library**: `tabula-py` wrapper or custom positional analysis
- **Use case**: PDF with tabular data → CSV/XLSX
- **Difficulty**: Very Hard

#### 3.3 Form Field Extraction
- **Use case**: PDF forms → JSON
- **Library**: Built into `pdf.js`
- **Difficulty**: Medium

---

## Supported Conversion Paths (To Update)

After implementation, update `_isConversionSupported()`:

```typescript
pdf: ['txt', 'md', 'html', 'docx', 'json', 'xml', 'csv', 'png', 'jpg'],
```

---

## Testing Strategy

### Test Files Needed
1. **Simple text PDF** - Basic paragraphs
2. **Multi-page PDF** - Pagination handling
3. **PDF with headings** - Structure detection
4. **PDF with tables** - Table extraction
5. **Scanned PDF** - OCR fallback (Phase 3)
6. **PDF with images** - Mixed content

### Validation Criteria
- [ ] Text extraction accuracy > 95%
- [ ] Heading detection works for common fonts
- [ ] Table extraction produces valid CSV for simple tables
- [ ] All conversions complete without errors
- [ ] Performance: < 3s for 10-page PDF

---

## Implementation Order (Recommended)

1. **Week 1**: Core text extraction (Phase 1)
2. **Week 2**: PDF → TXT, MD, HTML, DOCX
3. **Week 3**: PDF → JSON, XML, Image
4. **Week 4**: PDF → CSV (table extraction)
5. **Future**: OCR support

---

## Dependencies to Add

```json
{
  "pdfjs-dist": "^4.0.0"
}
```

**Note**: PDF.js requires a worker file. Configure in Vite:
```typescript
// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Copy pdf.worker.js to public folder
```

---

## Summary

| Conversion | Difficulty | Priority | Status |
|------------|------------|----------|--------|
| PDF → TXT  | Easy       | High     | Planned |
| PDF → MD   | Medium     | High     | Planned |
| PDF → HTML | Medium     | High     | Planned |
| PDF → DOCX | Easy       | High     | Planned |
| PDF → JSON | Easy       | Medium   | Planned |
| PDF → XML  | Easy       | Medium   | Planned |
| PDF → PNG  | Medium     | Medium   | Planned |
| PDF → JPG  | Medium     | Medium   | Planned |
| PDF → CSV  | Hard       | Low      | Future  |

---

## Next Steps (For Next Chat Session)

1. Install `pdfjs-dist` library
2. Configure Vite for PDF.js worker
3. Implement `extractPDFContent()` helper
4. Update `normalizeContent()` for PDF
5. Test with sample PDFs
6. Implement each conversion target one by one
