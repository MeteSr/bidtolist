import "@testing-library/jest-dom";
import { cleanup, act } from "@testing-library/react";
import { configure } from "@testing-library/dom";
import { afterEach } from "vitest";

// Increase waitFor / findBy default timeout so async UI updates complete
// under parallel-suite load.
configure({ asyncUtilTimeout: 10000 });

Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000", href: "http://localhost:3000/" },
  writable: true,
});

// Default matchMedia stub — jsdom doesn't implement matchMedia.
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// HTMLCanvasElement.getContext() stub — jsdom doesn't implement canvas rendering.
// WebGL contexts return a minimal truthy stub so WebGL-detection code treats
// the environment as WebGL-capable; explicit no-WebGL tests override this in
// their own beforeEach.
if (typeof HTMLCanvasElement !== "undefined") {
  // @ts-expect-error — test stub
  HTMLCanvasElement.prototype.getContext = (contextType: string) => {
    if (contextType === "webgl" || contextType === "experimental-webgl") {
      return { isContextLost: () => false };
    }
    return null;
  };
}

// window.indexedDB stub — jsdom provides no IDB implementation.
// AuthContext (and ICP auth-client) calls indexedDB.open() at mount; without
// this stub the call returns undefined and the promise-chain hangs, causing
// tests to time-out waiting on IDB-dependent async effects.
if (!("indexedDB" in window) || (window as any).indexedDB == null) {
  Object.defineProperty(window, "indexedDB", {
    writable: true,
    configurable: true,
    value: {
      open(_name: string, _version?: number): never {
        throw new DOMException("Not available in jsdom", "UnknownError");
      },
      deleteDatabase(): never {
        throw new DOMException("Not available in jsdom", "UnknownError");
      },
      cmp: () => 0,
    },
  });
}

// Default requestAnimationFrame stub.
if (typeof (globalThis as any).requestAnimationFrame !== "function") {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => { cb(0); return 0; };
  (globalThis as any).cancelAnimationFrame = () => {};
}

// Flush all pending async state updates before cleanup so React doesn't warn
// about state updates outside act(). setTimeout(r, 0) is a macrotask that
// fires only after the microtask queue is fully drained.
afterEach(async () => {
  await act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });
  cleanup();
});
