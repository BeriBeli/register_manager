import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

const root = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => MediaQueryList;
};

Object.defineProperty(root, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});
