# DocConverter Pro — Document Conversion Platform

Modern, client-side document conversion for 26+ formats with a responsive UI.

## Live Demo
- 🚀 https://docconverter-pro-app.netlify.app/

## ✨ Core Capabilities
- **26+ format conversions**: documents, slides, spreadsheets, data, and images.
- **Batch + ZIP output**: convert multiple files and download as a bundle.
- **Smart detection**: infers format from content, not only extensions.
- **Conversion history**: re-download or delete previous jobs.
- **Theming & UX**: dark/light mode, drag-and-drop uploads, progress feedback.
- **Client-side privacy**: files stay in the browser (no server upload).

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite.
- **UI/Styling**: TailwindCSS, shadcn/ui (Radix), Framer Motion, Lucide icons.
- **Conversion libs**: jsPDF, Mammoth, XLSX, Papa Parse, JSZip, html2canvas, markdown-it.
- **State & routing**: React Router, Context + reducers.

## 🚀 Getting Started
Requirements: Node.js 18+

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # preview the production build
npm run lint       # optional lint check
```

## 📁 Project Structure
- `src/` — app code (components, pages, contexts, services, lib).
- `public/` — static assets (favicon, logo, redirects).
- `resources/` — documentation and deployment summaries.
- `netlify.toml` — Netlify config for static deploys.

## 🔧 Configuration
- Environment variables: none required for local dev; set `NODE_VERSION=18` for Netlify (already in `netlify.toml`).
- Build output: `npm run build` creates `dist/` ready for static hosting.

## 📈 Notes
- All conversion work is client-side for speed and privacy.
- Large bundles come from the rich conversion toolchain; consider further code-splitting if you add more features.

## 📬 Contact
- Portfolio: https://muhammad-sharjeel-portfolio.netlify.app/
- Email: sharry00010@gmail.com
