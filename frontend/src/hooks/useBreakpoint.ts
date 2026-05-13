import { useState, useEffect } from "react";

// Returns 1024 in SSR/jsdom so tests always render the desktop layout.
const safeWidth = () =>
  typeof window !== "undefined" && window.innerWidth > 0
    ? window.innerWidth
    : 1024;

export function useBreakpoint() {
  const [width, setWidth] = useState(safeWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width < 1024,
  };
}
