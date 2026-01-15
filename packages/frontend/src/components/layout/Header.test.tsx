import "../../test/setup";
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
    it("renders title and action buttons", () => {
        render(<Header />);

        expect(screen.getByText("Register Manager")).toBeTruthy();
        expect(screen.getAllByRole("button")).toHaveLength(3);
    });
});
