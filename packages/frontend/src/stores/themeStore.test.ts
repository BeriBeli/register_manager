import "../test/setup";
import { describe, it, expect, beforeEach } from "bun:test";
import { useThemeStore } from "./themeStore";

describe("themeStore", () => {
    beforeEach(() => {
        document.documentElement.className = "";
        localStorage.clear();
    });

    it("applies dark theme to document root", () => {
        useThemeStore.getState().setTheme("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("uses system theme when configured", () => {
        useThemeStore.getState().setTheme("system");
        expect(document.documentElement.classList.contains("light")).toBe(true);
    });
});
