import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModeToggle from "@/app/components/ModeToggle";

describe("ModeToggle", () => {
  it("renders both mode buttons", () => {
    render(<ModeToggle mode="ui" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "UI Mode" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "CLI Mode" })).toBeInTheDocument();
  });

  it("marks the active mode as selected via aria-selected", () => {
    render(<ModeToggle mode="cli" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "CLI Mode" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "UI Mode" })).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with the clicked mode", () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="ui" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "CLI Mode" }));
    expect(onChange).toHaveBeenCalledWith("cli");
  });
});
