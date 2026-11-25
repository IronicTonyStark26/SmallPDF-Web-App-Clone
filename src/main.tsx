import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";

/** Optional client mount used outside the platform router. Not the preview entry. */
export function mountApp(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
