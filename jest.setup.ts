import "@testing-library/jest-dom";

// Polyfill structuredClone for fake-indexeddb (jsdom doesn't have it)
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
