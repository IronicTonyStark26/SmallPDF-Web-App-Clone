import { PRODUCT_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-line bg-canvas-muted">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-ink">{PRODUCT_NAME}</p>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            A private, browser-based tool for turning PDFs into Markdown. Documents are
            processed on your device and are not uploaded.
          </p>
        </div>
        <div className="text-sm text-ink-muted">
          <p className="font-medium text-ink">Privacy</p>
          <p className="mt-2 max-w-sm">
            Files stay in this browser session. They are not saved to an account, and this
            release does not send document contents to a server.
          </p>
          <p className="mt-4">© {year} {PRODUCT_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
