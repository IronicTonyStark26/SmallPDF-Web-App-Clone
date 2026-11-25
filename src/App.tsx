import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { FileUpload } from "@/features/upload/FileUpload";

const steps = [
  {
    title: "Upload your PDF",
    body: "Select a PDF from your device or drag it into the upload area.",
  },
  {
    title: "Convert to text",
    body: "PDF.js reads the document in your browser and returns the page text.",
  },
  {
    title: "Preview and download",
    body: "Markdown formatting and .md download arrive in a later release.",
  },
];

export function App() {
  return (
    <div id="top" className="min-h-screen bg-canvas text-ink">
      <Navbar />
      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
          <p className="text-sm font-semibold text-accent">PDF tool</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Convert PDF to Markdown
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
            Transform your PDF documents into clean, structured Markdown files. Fast, simple
            and private.
          </p>
        </section>

        <section id="tools" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <FileUpload />
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            This version checks each PDF, then extracts plain text locally. Markdown export is not included yet.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-card border border-line bg-canvas p-5 shadow-sm"
              >
                <p className="font-mono text-xs font-medium text-accent">Step {index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}
