export interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
}

export function textFromItems(items: readonly PdfTextItem[]): string {
  let out = "";
  for (const item of items) {
    if (typeof item.str !== "string" || item.str.length === 0) continue;
    out += item.str;
    out += item.hasEOL ? "\n" : " ";
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
}

export function joinPages(pages: readonly string[]): { text: string; kind: "text" | "no-text" } {
  const cleaned = pages.map((page) => page.trim());
  if (cleaned.every((page) => page.length === 0)) {
    return { text: "", kind: "no-text" };
  }
  return { text: cleaned.join("\n\n").trim(), kind: "text" };
}
