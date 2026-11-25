# Markdown Converter

Privacy-first, browser-based PDF to Markdown converter. Milestone 2 extracts plain text with PDF.js in the browser. Markdown generation is still Milestone 3.

Documents are read only in the browser. File bytes are not uploaded.

## Stack

- React 19 and TypeScript (strict)
- Vite, served by the workspace TanStack Start shell so the live preview and production build stay compatible with the hosting platform
- PDF.js 5, with the worker and standard fonts bundled locally
- Tailwind CSS
- Lucide icons
- Vitest and React Testing Library

A root `index.html` that loads `/src/main.tsx` is intentionally omitted. On this host that file replaces the document shell and the production build then fails to load its scripts. `src/main.tsx` still exports `mountApp` for a plain client mount. The live app is rendered by `src/routes/index.tsx`.

## Scripts

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run dev` starts the app for local preview. `npm test` runs the existing workspace checks and the Vitest suite in `tests/unit`.

## What works

- Drag and drop, multi-file picker, remove, and clear all
- Duplicate detection by name, size, and last modified time
- Validation for extension, MIME type, empty files, the 25 MB limit, and the `%PDF-` signature
- Sequential plain-text extraction with page progress and cancellation
- Clear failures for corrupt, password-protected, and image-only PDFs
- Desktop, tablet, and mobile layout
- Security headers in `public/_headers` for static hosts that honor that file

## Limitations

- No Markdown formatting or `.md` download
- No OCR for scanned pages
- Password-protected PDFs are rejected rather than unlocked
- A valid header is not a full PDF parse; broken files fail during extraction
- `public/_headers` applies on hosts such as Cloudflare Pages. It is not injected by the Vite dev server
- The platform shell may load its own preview script from grok.com. The converter does not send PDF bytes there
